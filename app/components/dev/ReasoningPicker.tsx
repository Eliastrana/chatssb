'use client';
import React from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";

interface PickerProps {
    selectedReasoning: boolean;
    onSelectedReasoning: (model: boolean) => void;
}

const ReasoningPicker: React.FC<PickerProps> = ({ selectedReasoning, onSelectedReasoning }) => {
    const reasoningOptions: DropdownOption<boolean>[] = [
        { label: 'Reasoning', value: true },
        { label: 'No Reasoning', value: false },
    ];

    const handleSelect = (value: boolean) => {
        onSelectedReasoning(value);
    };

    return (
        <div className="">
            <CustomDropdown
                options={reasoningOptions}
                selectedValue={selectedReasoning}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default ReasoningPicker;
