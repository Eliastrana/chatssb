'use client';
import React, {useState} from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";
import {SelType} from "@/app/types";

interface SelectionPickerProps {
    onSelectSelection: (model: SelType) => void;
}

const SelectionPicker: React.FC<SelectionPickerProps> = ({ onSelectSelection }) => {
    const selectionOptions: DropdownOption<SelType>[] = [
        { label: 'Singlethreaded Manual', value: SelType.Singlethreaded },
        { label: 'Multithreaded Manual', value: SelType.Multithreaded },
        { label: 'Singlethreaded Enum', value: SelType.EnumSinglethreaded},
        { label: 'Multithreaded Enum', value: SelType.EnumMultithreaded},
        { label: 'Singlethreaded Schema', value: SelType.SchemaSinglethreaded}
    ];

    const [selection, setSelection] = useState<SelType>(selectionOptions[0].value);
    
    
    const handleSelect = (value: SelType) => {
        setSelection(value);
        onSelectSelection(value);
        }

    return (
        <div className="">
            <CustomDropdown
                options={selectionOptions}
                selectedValue={selection}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default SelectionPicker;
