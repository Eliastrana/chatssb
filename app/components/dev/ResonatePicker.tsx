'use client';
import React from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";

interface PickerProps {
    selectedResonate: boolean;
    oneSelectedResonate: (model: boolean) => void;
}

const ResonatePicker: React.FC<PickerProps> = ({ selectedResonate, oneSelectedResonate }) => {
    const resonateOptions: DropdownOption<boolean>[] = [
        { label: 'Resonate', value: true },
        { label: 'No Resonate', value: false },
    ];

    const handleSelect = (value: boolean) => {
        oneSelectedResonate(value);
    };

    return (
        <div className="">
            <CustomDropdown
                options={resonateOptions}
                selectedValue={selectedResonate}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default ResonatePicker;
