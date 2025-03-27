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
        { label: 'Singlethreaded Manual', value: SelType.Singlethreaded },
        { label: 'Multithreaded Manual', value: SelType.Multithreaded },
        { label: 'Singlethreaded Enum', value: SelType.EnumSinglethreaded},
        { label: 'Multithreaded Enum', value: SelType.EnumMultithreaded},
        { label: 'Singlethreaded Schema', value: SelType.SchemaSinglethreaded}
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
