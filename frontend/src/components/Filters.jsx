import { useState, useRef, useEffect } from "react";

function Filters({ onChange }) {
  const [sexOpen, setSexOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  const [selectedSex, setSelectedSex] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSexOpen(false);
        setAgeOpen(false);
        setSizeOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Notify parent when filters change
  useEffect(() => {
    if (onChange) {
      onChange({
        sex: selectedSex,
        age: selectedAge,
        size: selectedSize,
      });
    }
  }, [selectedSex, selectedAge, selectedSize]);

  return (
    <div className="flex justify-center gap-4 mb-8" ref={dropdownRef}>
      {/* SEX */}
      <div className="relative">
        <button
          className="px-8 py-2 rounded-full bg-blue-300 text-white shadow"
          onClick={() => {
            setSexOpen(!sexOpen);
            setAgeOpen(false);
            setSizeOpen(false);
          }}
        >
          {selectedSex ? `Sex: ${selectedSex}` : "Sex"}
        </button>

        {sexOpen && (
          <div className="absolute mt-2 w-40 bg-white shadow-lg rounded-lg border z-20">
            {["Male", "Female", "Other"].map((option) => (
              <div
                key={option}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                onClick={() => {
                  setSelectedSex(option);
                  setSexOpen(false);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AGE */}
      <div className="relative">
        <button
          className="px-8 py-2 rounded-full bg-blue-300 text-white shadow"
          onClick={() => {
            setAgeOpen(!ageOpen);
            setSexOpen(false);
            setSizeOpen(false);
          }}
        >
          {selectedAge ? `Age: ${selectedAge}` : "Age"}
        </button>

        {ageOpen && (
          <div className="absolute mt-2 w-40 bg-white shadow-lg rounded-lg border z-20">
            {["0-2", "3-6", "6+"].map((range) => (
              <div
                key={range}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                onClick={() => {
                  setSelectedAge(range);
                  setAgeOpen(false);
                }}
              >
                {range}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIZE */}
      <div className="relative">
        <button
          className="px-8 py-2 rounded-full bg-blue-300 text-white shadow"
          onClick={() => {
            setSizeOpen(!sizeOpen);
            setSexOpen(false);
            setAgeOpen(false);
          }}
        >
          {selectedSize ? `Size: ${selectedSize}` : "Size"}
        </button>

        {sizeOpen && (
          <div className="absolute mt-2 w-40 bg-white shadow-lg rounded-lg border z-20">
            {["Small", "Medium", "Large"].map((size) => (
              <div
                key={size}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                onClick={() => {
                  setSelectedSize(size);
                  setSizeOpen(false);
                }}
              >
                {size}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Filters;
