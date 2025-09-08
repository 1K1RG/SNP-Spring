# SNP-Spring: Development Setup

## Prerequisites

- **Java 21**
- **Maven**
- **NPM**
- **Miniconda**
- **WSL** (if using Windows)

## Setup Instructions

### 1. Install RicePHG

RicePHG is required for backend genomic services. Follow the [RicePHG installation guide](https://github.com/pmvijar/RicePHG):

```bash
git clone https://github.com/pmvijar/RicePHG.git
cd RicePHG
conda env create -f environment.yml
conda activate Ricephg-conda
fastapi dev app/main.py --port 7000
```

> [!NOTE]  
> On Windows, use WSL to run the above commands.

### 2. Start the Frontend

Navigate to the `snp-seek` folder:

```bash
cd snp-seek
npm install
npm start
```

### 3. Start Backend Services

Open a new terminal for each service and run the following commands from the project root:

#### API Gateway

```bash
cd api-gateway
mvn spring-boot:run
```

#### Geneloci Service

```bash
cd geneloci-service/geneloci-service
mvn spring-boot:run
```

#### List Service

```bash
cd list-service
mvn spring-boot:run
```

#### User Service

```bash
cd user-service
mvn spring-boot:run
```

#### Variety Service

```bash
cd variety-service
mvn spring-boot:run
```
