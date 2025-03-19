import React, { useState, useRef, useEffect } from "react";

export type DropdownOption<T> = {
    label: string;
    value: T;
};

export interface CustomDropdownProps<T> {
    options: ReadonlyArray<DropdownOption<T>>;
    selectedValue: T;
    onSelect: (newValue: T) => void;
}

export function CustomDropdown<T>({
                                      options,
                                      selectedValue,
                                      onSelect,
                                  }: CustomDropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedOption = options.find((opt) => opt.value === selectedValue);

    return (
        <div className="relative inline-block text-left z-10" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="px-2 py-1 border-2 border-[#274247] rounded-lg bg-white flex items-center"
            >
                {selectedOption ? selectedOption.label : "Velg diagramtype"}
                <span
                    className={`
                        material-symbols-outlined ml-2 transition-transform align-middle
                        ${isOpen ? "rotate-180" : "rotate-0"}`}
                >
                    keyboard_arrow_down
                </span>
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-1 w-48 rounded-lg shadow-md bg-white border-2 border-[#274247]">
                    {options.map((opt) => {
                        const isSelected = opt.value === selectedValue;
                        return (
                            <div
                                key={String(opt.value)}
                                onClick={() => {
                                    onSelect(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-[#C3DCDC] hover:text-black hover:underline ${
                                    isSelected ? "bg-[#274247] text-white" : "text-black"
                                } first:rounded-t-md last:rounded-b-md`}
                            >
                                <span>{opt.label}</span>
                                {isSelected && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#F0F8F9"
                                    >
                                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
