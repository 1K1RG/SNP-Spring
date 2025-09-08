'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from './ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.tsx';
import { Input } from './ui/input.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx';
import React from "react";
import ReactFlow, { Background, Controls, type Edge, MarkerType, MiniMap, type Node, Position, ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../services/api.js';
import { motion } from "framer-motion";

interface PHGData {
    sample_name: string;
    id: string;
    contig: string;
    alleles: string[];
    pos_start: number;
    pos_end: number;
    fmt_GT: number[];
}

interface SamplePosition {
    sample_name: string;
    pos_start: number;
    pos_end: number;
}

interface ChromosomesPerSample {
    sample_name: string;
    contig: string[];
}

interface SampleRegionsResponse {
    min_positions: SamplePosition[];
    max_positions: SamplePosition[];
    chromosomes_per_sample: ChromosomesPerSample[];
}

interface ProjectData {
    Project_Name: string;
    Reference_Name: string;
}

const MAX_WINDOW_SIZE = 500000;

const PHGVisualization: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [data, setData] = useState<PHGData[]>([]);

    // States for visualization window
    const [isCardCollapsed, setIsCardCollapsed] = useState(false);
    const [availableProjects, setAvailableProjects] = useState<ProjectData[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedSample, setSelectedSample] = useState('');
    const [availableSamples, setAvailableSamples] = useState<string[]>([]);
    const [contig, setContig] = useState('');
    const [start, setStart] = useState(0);
    const [regionSize, setRegionSize] = useState(0);
    const [minBoundary, setMinBoundary] = useState(0);
    const [maxBoundary, setMaxBoundary] = useState(0);
    const [availableContigs, setAvailableContigs] = useState<string[]>([]);

    const [submittedContig, setSubmittedContig] = useState('');
    // State for node click
    const [isNodeClicked, setIsNodeClicked] = useState(false)
    const [selectedNode, setSelectedNode] = useState({
        allele:"",
        start:"",
        end:""
    })

    // Cache for region data using a ref (keyed by "contig:start-adjustedEnd")
    const regionCacheRef = useRef<Record<string, PHGData[]>>({});
    // Cache for regions metadata
    const regionsDataRef = useRef<SampleRegionsResponse | null>(null);

    const [isFetchingSampleRegions, setIsFetchingSampleRegions] = useState(false); // NEW

    // ReactFlow instance ref for imperative actions
    const reactFlowRef = useRef<ReactFlowInstance | null>(null); // NEW

    // Dropdown state and refs
    const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);
    const sampleInputRef = useRef<HTMLInputElement>(null);
    const sampleDropdownRef = useRef<HTMLDivElement>(null);

    // Hide dropdown on outside click
    useEffect(() => {
        if (!sampleDropdownOpen) return;
        function handleClick(e: MouseEvent) {
            if (
                sampleDropdownRef.current &&
                !sampleDropdownRef.current.contains(e.target as HTMLElement) &&
                sampleInputRef.current &&
                !sampleInputRef.current.contains(e.target as HTMLElement)
            ) {
                setSampleDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [sampleDropdownOpen]);

    // Fetch sample regions when project changes
    useEffect(() => {
        const fetchSampleRegions = async () => {
            if (!selectedProject) return;

            setIsFetchingSampleRegions(true); // NEW

            try {
                
                const res = await api.post(
                    `/PHG/query/sample_regions`,
                    {
                        Project_Name: selectedProject,
                        Reference_Name: selectedProject
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!res.data) throw new Error('Error fetching sample regions');
                const regionsData: SampleRegionsResponse = await res.data;

                // Store in ref for later use
                regionsDataRef.current = regionsData;

                // Get unique sample names from the API response
                const samples = regionsData.chromosomes_per_sample.map((item) => item.sample_name);

                // if sample is 'CX230', remove it from the list
                const filteredSamples = samples.filter((sample) => sample !== 'CX230');
                
                setAvailableSamples(filteredSamples);

                

                // Reset sample and contig when project changes
                setSelectedSample('');
                setContig('');
            } catch (error) {
                console.error('Error fetching sample regions:', error);
            } finally {
                setIsFetchingSampleRegions(false); // NEW
            }
        };

        fetchSampleRegions();
    }, [selectedProject]);

    // Fetch available projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {

                // const res = await fetch('http://127.0.0.1:9000/get-directory-projects');
                const res = await api.get('/PHG/pipeline/get-directory-projects');

                if (!res.data) throw new Error('Error fetching available projects');
                const response = await res.data;

                // Handle the new response format with "Files" array
                if (response.Files && Array.isArray(response.Files)) {
                    const projects = response.Files.map((projectName: string) => ({
                        Project_Name: projectName
                    }));

                    setAvailableProjects(projects);

                    // Remove default project selection on mount
                    // (No longer auto-select a project)
                } else {
                    console.error('Unexpected response format from get-directory-projects:', response);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjects();
    }, []);

    // Update contigs when sample changes
    useEffect(() => {
        if (selectedSample && regionsDataRef.current) {
            // Get contigs for selected sample
            const chromObj = regionsDataRef.current.chromosomes_per_sample.find(
                (item) => item.sample_name === selectedSample
            );

            if (chromObj) {
                setAvailableContigs(chromObj.contig);
                // Use setTimeout to avoid setting state during render
                setTimeout(() => {
                    setContig(chromObj.contig[0] || ''); // Default to first contig
                }, 0);
            } else {
                setAvailableContigs([]);
                setContig('');
            }

            // Get min/max positions for selected sample
            const minObj = regionsDataRef.current.min_positions.find((item) => item.sample_name === selectedSample);
            const maxObj = regionsDataRef.current.max_positions.find((item) => item.sample_name === selectedSample);

            if (minObj && maxObj) {
                // Use setTimeout to batch these state updates
                setTimeout(() => {
                    setMinBoundary(minObj.pos_start);
                    setMaxBoundary(maxObj.pos_end);
                    setStart(minObj.pos_start);
                    // Set initial region size as the minimum between MAX_WINDOW_SIZE or max available
                    setRegionSize(Math.min(MAX_WINDOW_SIZE, maxObj.pos_end - minObj.pos_start));
                }, 0);
            } else {
                setTimeout(() => {
                    setMinBoundary(0);
                    setMaxBoundary(0);
                    setStart(0);
                    setRegionSize(0);
                }, 0);
            }
        }
    }, [selectedSample]);

    // Fix: Call fitView after nodes/edges update to ensure scroll/zoom works
    useEffect(() => {
        if (reactFlowRef.current) {
            reactFlowRef.current.fitView();
        }
    }, [nodes, edges]);

    // Calculate the effective maximum for the slider based on boundaries.
    const effectiveSliderMax = Math.min(MAX_WINDOW_SIZE, maxBoundary - start);

    const fetchData = async () => {
        setSubmittedContig(contig);
        // The region is defined by "start" and the region size slider.
        // Enforce maximum window size of MAX_WINDOW_SIZE
        const effectiveSize = regionSize > MAX_WINDOW_SIZE ? MAX_WINDOW_SIZE : regionSize;
        const adjustedEnd = start + effectiveSize;
        const cacheKey = `${selectedProject}:${contig}:${start}-${adjustedEnd}`;

        // Use cached data if available
        if (regionCacheRef.current[cacheKey]) {
            setData(regionCacheRef.current[cacheKey]);
            processData(regionCacheRef.current[cacheKey], selectedSample);

            return;
        }

        try {
            
            const response = await api.post(
                `/PHG/query/regions?chro=${contig}&position=${start}-${adjustedEnd}`,
                {
                    Project_Name: selectedProject,
                    Reference_Name: selectedProject,
                    chro: contig,
                    position: `${start}-${adjustedEnd}`,
                    // samples: ['IRGSP', 'SeqAzucena', 'SeqIR64'],
                    samples: availableSamples,
                    attrs: ['sample_name', 'id', 'contig', 'alleles', 'pos_start', 'pos_end', 'fmt_GT']
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) {
                throw new Error('Network response was not ok');
            }

            const data: PHGData[] = await response.data;
            // Cache the fetched data
            regionCacheRef.current[cacheKey] = data;
            setData(data);
            processData(data, selectedSample);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


     const handleNodeClick = (event: React.MouseEvent, node: Node) => {
        const match = node.id.match(/([A-Za-z0-9]+)-(\d+)-(\d+)/);        
        
        if (!match) {
            console.error("Invalid node ID format:", node.id);
            return;
        }
    
        const allele = match[1]; // e.g., "IRGSP"
        const start = match[2];  // e.g., "141750"
        const end = match[3];    // e.g., "144408"

        setSelectedNode({ allele, start, end });

        setIsNodeClicked(true)
    
    };

    
    const processData = (data: PHGData[], referenceSample: string) => {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // Create ordered sample list with selected sample first
        const allSamples = availableSamples
        const orderedSamples = [referenceSample, ...allSamples.filter((sample) => sample !== referenceSample)];

        // Set up vertical positions for each sample (first sample at top)
        const yPositions: Record<string, number> = {};
        orderedSamples.forEach((sample, idx) => {
            yPositions[sample] = 100 + idx * 100; // 100px spacing between rows
        });

        const nodeHeight = 50;
        const xGap = 20;

        let xPosition = 0;
        const prevNodes: { [key: string]: string } = {};

        // Group data by position to ensure we process nodes at the same position together
        const groupedData: { [key: string]: PHGData[] } = {};

        data.forEach((item) => {
            const posKey = `${item.pos_start}-${item.pos_end}`;
            if (!groupedData[posKey]) {
                groupedData[posKey] = [];
            }
            groupedData[posKey].push(item);
        });
        
        // Process groups in order of position
        Object.keys(groupedData)
            .sort((a, b) => {
                const [aStart] = a.split('-').map(Number);
                const [bStart] = b.split('-').map(Number);

                return aStart - bStart;
            })
            .forEach((posKey) => {
                const items = groupedData[posKey];

                // Collect all alleles at this position for each sample
                const allelesBySample: Record<string, string> = {};
                items.forEach((item) => {
                    // Use the second allele (index 1) as the representative allele
                    allelesBySample[item.sample_name] = item.alleles[1] || '';
                });

                // Get reference allele for this position
                const referenceAllele = allelesBySample[referenceSample] || '';

                // Find all unique alleles at this position
                const alleleValues = Object.values(allelesBySample);
                const uniqueAlleles = [...new Set(alleleValues)];

                // Create a color map specifically for this position
                const positionColorMap: Record<string, string> = {};

                // Reference allele always gets the first color
                positionColorMap[referenceAllele] = '#5096f2'; // Blue

                // Assign other colors to other unique alleles at this position
                let colorIndex = 1;
                const alternateColors = ['#f25050', '#50f250']; // Red, Green

                uniqueAlleles.forEach((allele) => {
                    if (allele !== referenceAllele) {
                        positionColorMap[allele] = alternateColors[colorIndex - 1];
                        colorIndex++;
                    }
                });

                // Process all items at this position
                items.forEach((item, index) => {
                    const width = (item.pos_end - item.pos_start) / 30;
                    const nodeId = `${item.sample_name}-${posKey}-${index}`;

                    // Get the allele for this sample at this position
                    const allele = allelesBySample[item.sample_name];

                    // Determine color based on the position-specific color map
                    const color = positionColorMap[allele] || '#cccccc'; // Default to gray if not found

                    newNodes.push({
                        id: nodeId,
                        type: 'default',
                        data: {
                            label: (
                                <>
                                    <div className='truncate text-xs'>{item.sample_name}</div>
                                    <div className='truncate text-[10px]'>
                                        {item.pos_start} - {item.pos_end}
                                    </div>
                                </>
                            )
                        },
                        position: {
                            x: xPosition,
                            y: yPositions[item.sample_name]
                        },
                        style: {
                            width,
                            height: nodeHeight,
                            backgroundColor: color,
                            border: '1px solid #222',
                            borderRadius: '4px'
                        },
                        sourcePosition: Position.Right,
                        targetPosition: Position.Left
                    });

                    if (prevNodes[item.sample_name]) {
                        newEdges.push({
                            id: `${prevNodes[item.sample_name]}-${nodeId}`,
                            source: prevNodes[item.sample_name],
                            target: nodeId,
                            type: 'smoothstep',
                            markerEnd: {
                                type: MarkerType.ArrowClosed
                            }
                        });
                    }

                    prevNodes[item.sample_name] = nodeId;
                });

                // Move x position forward after processing all samples at this position
                if (items.length > 0) {
                    const firstItem = items[0];
                    xPosition += (firstItem.pos_end - firstItem.pos_start) / 30 + xGap;
                }
            });

        setNodes(newNodes);
        setEdges(newEdges);
    };

    return (
        <div className='h-full w-full mb-4  rounded-md'>
            {isNodeClicked && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 ease-out animate-fadeIn">
                        <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.9 }} 
                        transition={{ duration: 0.2, ease: "linear" }}
                        className="relative flex flex-col bg-white p-6 rounded-lg shadow-lg h-[90%] w-[90%] max-w-[1500px] overflow-hidden  transform transition-all duration-300 scale-95 animate-scaleUp">
                          <button 
                            onClick={() => setIsNodeClicked(false)} 
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition duration-200 "
                          >
                            ✕
                          </button>
            
                          <h2 className="text-xl font-['Poppins-Bold'] text-green-2 mb-4">Node Details</h2>
            
                          <div className="bg-gray-100 p-4 rounded-lg shadow-md space-y-2">
            
                            <div className="grid grid-cols-2 gap-4 text-sm ">
                              <p className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Alelle:</strong> {selectedNode.allele}</p>
                              <p className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Contig:</strong> {submittedContig}</p>
                              <p className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Start:</strong> {selectedNode.start}</p>
                              <p className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">End:</strong> {selectedNode.end}</p>
                            </div>
                          </div>
            
                          {/* Skeleton Loader */}
                          <div id="skeleton" className="relative h-full animate-pulse space-y-4 mt-4">
                            <div className="h-6 bg-gray-300 rounded"></div>
                            <div className="h-[90%] bg-gray-200 rounded"></div>
                          </div>
            
                          {/* iFrame for JBrowse */}
                          <iframe 
                            id="snpIframe"
                            src={`https://snp-seek.irri.org/jbrowse/?loc=${submittedContig}%3A${selectedNode.start}..${selectedNode.end}`}
                            width="100%" 
                            height="100%" 
                            className="hidden mt-4 rounded-md shadow"
                            onLoad={() => {
                              setTimeout(() => {
                                const skeleton = document.getElementById('skeleton');
                                const iframe = document.getElementById('snpIframe');
                          
                                if (skeleton) skeleton.style.display = 'none';
                                if (iframe) iframe.classList.remove('hidden');
                              }, 500); // Delay of 500ms
                            }}
            
                            
                          />
                        </motion.div>
                      </div>
                    )}
            {/* React Flow Container with overlays */}
            <div className='relative' style={{ width: '100%', height: '900px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodeClick={handleNodeClick}
                    fitView
                  
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
                {/* Set Visualization Window Card at top left */}
                <div className='absolute left-4 top-4 z-10 rounded-md bg-white bg-opacity-50 p-4'>
                    <Card className='bg-transparent shadow-none'>
                        <CardHeader>
                            <CardTitle className="text-green-1 text-md font-['Poppins-Bold']">Set Visualization Window</CardTitle>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setIsCardCollapsed(!isCardCollapsed)}
                                className='h-6 px-2 rounded-md text-green-1 hover:bg-green-2 hover:text-yellow-1 transition-all ease-out duration-300'>
                                {isCardCollapsed ? 'Expand' : 'Collapse'}
                            </Button>
                        </CardHeader>
                       {!isCardCollapsed && ( <CardContent className='flex flex-col space-y-3'>
                            {/* Project Selection */}
                            <div className='flex flex-col space-y-1'>
                                    <label className="text-sm font-['Lato-Regular'] font-bold">Project</label>
                                    <Select
                                        value={selectedProject}
                                        onValueChange={(value) => {
                                            setSelectedProject(value);
                                            // Reset sample when project changes
                                            setSelectedSample('');
                                            setContig('');
                                        }}>
                                        <SelectTrigger className='w-40'>
                                            <SelectValue placeholder='Select Project' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableProjects.map((project) => (
                                                <SelectItem className="data-[highlighted]:bg-green-2 data-[highlighted]:text-yellow-1" key={project.Project_Name} value={project.Project_Name}>
                                                    {project.Project_Name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            {/* Sample Selection (Autocomplete) */}
                            <div className='flex flex-col space-y-1'>
                                <label className="text-sm font-['Lato-Regular'] font-bold">Sample</label>
                                <div className="relative w-40">
                                    <div className="flex items-center">
                                        <Input
                                            ref={sampleInputRef}
                                            type="text"
                                            placeholder="Type or select sample"
                                            value={selectedSample}
                                            onChange={e => {
                                                setSelectedSample(e.target.value);
                                                setContig('');
                                                setSampleDropdownOpen(true);
                                            }}
                                            disabled={!selectedProject || isFetchingSampleRegions}
                                            className="w-40"
                                            autoComplete="off"
                                            onFocus={() => setSampleDropdownOpen(true)}
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className="ml-[-32px] z-10 p-1 rounded hover:bg-gray-100"
                                            onClick={() => setSampleDropdownOpen((v) => !v)}
                                            aria-label="Show sample dropdown"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                                <path d="M6 8l4 4 4-4" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                    {sampleDropdownOpen && availableSamples.length > 0 && (
                                        <div
                                            ref={sampleDropdownRef}
                                            className="absolute z-20 bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto w-full mt-1"
                                        >
                                            {availableSamples
                                                .filter(sample =>
                                                    sample.toLowerCase().includes(selectedSample.toLowerCase())
                                                )
                                                .slice(0, 20)
                                                .map(sample => (
                                                    <div
                                                        key={sample}
                                                        className={`px-2 py-1 cursor-pointer hover:bg-green-2 hover:text-yellow-1 text-sm font-['Lato-Regular'] ${
                                                            sample === selectedSample ? 'bg-green-2 text-yellow-1' : ''
                                                        }`}
                                                        onMouseDown={() => {
                                                            setSelectedSample(sample);
                                                            setContig('');
                                                            setSampleDropdownOpen(false);
                                                        }}
                                                    >
                                                        {sample}
                                                    </div>
                                                ))}
                                            {availableSamples.filter(sample =>
                                                sample.toLowerCase().includes(selectedSample.toLowerCase())
                                            ).length === 0 && (
                                                <div className="px-2 py-1 text-gray-400 text-sm">No matches</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Chromosome Selection with Label */}
                            <div className='flex flex-col space-y-1'>
                                <label className="text-sm font-['Lato-Regular'] font-bold">Chromosome</label>
                                <Select
                                    value={contig}
                                    onValueChange={setContig}
                                    disabled={!selectedSample || isFetchingSampleRegions} // MODIFIED
                                >
                                    <SelectTrigger className='w-40'>
                                        <SelectValue placeholder='Select Contig' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableContigs.map((c) => (
                                            <SelectItem className=" data-[highlighted]:bg-green-2 data-[highlighted]:text-yellow-1" key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-600 font-['Lato-Regular'] ">
                                    Chromosome Region: {minBoundary} - {maxBoundary} bp
                                </p>
                            </div>

                            {/* Starting Position with Label */}
                            <div className='flex flex-col space-y-1'>
                                <label className="text-sm font-['Lato-Regular'] font-bold">Starting Position</label>
                                <Input
                                    type='number'
                                    placeholder='Start'
                                    value={start}
                                    min={minBoundary}
                                    max={maxBoundary}
                                    onChange={(e) => setStart(Number(e.target.value))}
                                    className='w-24'
                                    disabled={!contig || isFetchingSampleRegions} // MODIFIED
                                />
                            </div>

                            {/* Slider for Region Size Selection */}
                            <div className='flex flex-col'>
                                <label className="text-sm font-['Lato-Regular'] mb-2 font-bold">
                                    Region Size: {regionSize} bp (Max: {effectiveSliderMax} bp)
                                </label>
                                <input
                                    type='range'
                                    value={regionSize}
                                    min={100}
                                    max={effectiveSliderMax}
                                    onChange={(e) => setRegionSize(Number(e.target.value))}
                                    className='w-full accent-green-2  '
                                    disabled={!contig || isFetchingSampleRegions} // MODIFIED
                                />
                            </div>

                            <Button
                                className="bg-green-2 text-white font-[Poppins-Bold] w-[80%] mx-auto transition-all ease-out duration-300 hover:text-yellow-1 hover:bg-green-2 "
                                onClick={fetchData}
                                disabled={!contig || isFetchingSampleRegions} // MODIFIED
                            >
                                Visualize
                            </Button>
                        </CardContent>)}
                    </Card>
                </div>
                {/* Legend Card at top right */}
                <div className='absolute right-4 top-4 z-10 rounded-md bg-white bg-opacity-50 p-4'>
                    <Card className='bg-transparent shadow-none'>
                        <CardHeader>
                            <CardTitle className='font-[Poppins-Bold] text-green-1'>Legend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='flex flex-col space-y-2'>
                                <div className='flex flex-col space-y-2'>
                                    <div className='flex items-center space-x-1'>
                                        <div className='size-4 rounded-sm' style={{ backgroundColor: '#5096f2' }} />
                                        <span className="text-sm font-['Lato-Regular']">Reference Allele ({selectedSample})</span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                        <div className='size-4 rounded-sm' style={{ backgroundColor: '#f25050' }} />
                                        <span className="text-sm font-['Lato-Regular']">Different Allele 1</span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                        <div className='size-4 rounded-sm' style={{ backgroundColor: '#50f250' }} />
                                        <span className="text-sm font-['Lato-Regular']">Different Allele 2</span>
                                    </div>
                                </div>
                                <div className='text-xs text-gray-600'>
                                    Colors indicate allele similarity within each position:
                                    <ul className="mt-1 list-disc pl-4 font-['Lato-Regular'] ">
                                        <li>Blue always represents the reference allele</li>
                                        <li>Same colors = identical alleles</li>
                                        <li>Different colors = different alleles</li>
                                        <li>Maximum of 3 colors per position (one for each unique allele)</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PHGVisualization;