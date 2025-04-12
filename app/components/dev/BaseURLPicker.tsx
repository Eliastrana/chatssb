'use client';
import React from 'react';
import { CustomDropdown, DropdownOption } from "@/app/components/Graphing/util/CustomDropdown";

interface BaseURLPickerProps {
    selectedBaseURL: boolean;
    onSelectBaseURL: (model: boolean) => void;
}

const SelectionPicker: React.FC<BaseURLPickerProps> = ({ selectedBaseURL, onSelectBaseURL }) => {
    const baseURLOptions: DropdownOption<boolean>[] = [
        { label: 'Default URL', value: false },
        { label: 'QA URL', value: true },
    ];

    const handleSelect = (value: boolean) => {
        onSelectBaseURL(value);
    };

    return (
        <div className="">
            <CustomDropdown
                options={baseURLOptions}
                selectedValue={selectedBaseURL}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default SelectionPicker;
