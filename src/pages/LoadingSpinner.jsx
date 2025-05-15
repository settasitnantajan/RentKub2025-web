import { Home, Loader2 } from 'lucide-react';

const LoadingSpinner = ({ customText = "Loading, please wait..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-100 bg-opacity-75 backdrop-blur-sm">
      {/* Using a card-like container for the loading elements for better visual grouping */}
      <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-xl shadow-2xl">
        <div className="flex items-center space-x-2">
          {/* The spinning circle */}
          <Loader2 className="h-12 w-12 animate-spin text-red-500" />
          {/* The house icon */}
          <Home className="h-14 w-14 text-red-500" />
          {/* The Rentkub word */}
          <span className="text-4xl font-bold text-red-600 tracking-tight">Rentkub</span>
        </div>
        <p className="mt-4 text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;