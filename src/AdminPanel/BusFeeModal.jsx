import React, { useState, useEffect } from "react";

export default function BusFeeModal({ isOpen, onClose }) {
  const [busStopsData, setBusStopsData] = useState([]);
  const [busStopSearch, setBusStopSearch] = useState("");
  const [busStopSuggestions, setBusStopSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/busData.json")
        .then((res) => res.json())
        .then((data) => setBusStopsData(data))
        .catch(() => setBusStopsData([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (busStopSearch.length >= 3) {
      const filtered = busStopsData.filter((stop) =>
        stop.busStopName && stop.busStopName.toLowerCase().includes(busStopSearch.toLowerCase())
      );
      setBusStopSuggestions(filtered.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setBusStopSuggestions([]);
      setShowSuggestions(false);
      setSelectedStop(null);
    }
  }, [busStopSearch, busStopsData]);

  const handleBusStopSelect = (stop) => {
    setSelectedStop(stop);
    setBusStopSearch(stop.busStopName);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative pointer-events-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-blue-900 mb-4">Bus Fee</h2>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Bus Stop Name</label>
          <input
            type="text"
            value={busStopSearch}
            onChange={(e) => {
              setBusStopSearch(e.target.value);
              setSelectedStop(null);
            }}
            onFocus={() => busStopSearch.length >= 3 && setShowSuggestions(true)}
            placeholder="Type at least 3 characters to search..."
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            style={{ textTransform: "uppercase" }}
            autoComplete="off"
          />
          {showSuggestions && busStopSuggestions.length > 0 && !selectedStop && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {busStopSuggestions.map((stop, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (!selectedStop || selectedStop.busStopName !== stop.busStopName) {
                      handleBusStopSelect(stop);
                    }
                  }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium">{stop.busStopName}</span>
                  <span className="text-xs text-gray-500 ml-2">({stop.route})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedStop && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
            <div><span className="font-semibold">Bus Stop:</span> {selectedStop.busStopName}</div>
            <div><span className="font-semibold">Route:</span> {selectedStop.route}</div>
            <div><span className="font-semibold">Bus No:</span> {selectedStop.routeNo}</div>
            <div><span className="font-semibold">Bus Fees (Per Year):</span> <span className="text-green-700 font-bold">₹ {selectedStop.semFees}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
