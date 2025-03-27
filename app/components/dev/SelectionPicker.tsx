'use client';
import React from 'react';
import { CustomDropdown, DropdownOption } from "@/app/components/Graphing/util/CustomDropdown";
import { SelType } from "@/app/types";

interface SelectionPickerProps {
    selectedSelection: SelType;
    onSelectSelection: (model: SelType) => void;
}

const SelectionPicker: React.FC<SelectionPickerProps> = ({ selectedSelection, onSelectSelection }) => {
    const selectionOptions: DropdownOption<SelType>[] = [
        { label: 'Singlethreaded Manual', value: SelType.SingleThreaded },
        { label: 'Multithreaded Manual', value: SelType.MultiThreaded },
        { label: 'Singlethreaded Enum', value: SelType.EnumSingleThreaded },
        { label: 'Multithreaded Enum', value: SelType.EnumMultiThreaded },
    ];

    const handleSelect = (value: SelType) => {
        onSelectSelection(value);
    };

    return (
        <div className="">
            <CustomDropdown
                options={selectionOptions}
                selectedValue={selectedSelection}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default SelectionPicker;
