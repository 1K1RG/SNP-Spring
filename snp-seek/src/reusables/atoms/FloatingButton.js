
export default function FloatingButton({icon: Icon, setter, value}) {
  
  return (
      <button
          className="z-40 fixed bottom-6 right-6 bg-green-2 text-white rounded-full p-4 shadow-lg flex items-center"
          onClick={() => setter(value)}
      >
        <Icon className="w-6 h-6" />
      </button>
  );
}
