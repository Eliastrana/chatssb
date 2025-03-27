'use client';
import React, {useState} from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";
import {SelType} from "@/app/types";

interface SelectionPickerProps {
    onSelectSelection: (model: SelType) => void;
}

const SelectionPicker: React.FC<SelectionPickerProps> = ({ onSelectSelection }) => {
    const selectionOptions: DropdownOption<SelType>[] = [
        { label: 'Singlethreaded Manual', value: SelType.SingleThreaded },
        { label: 'Multithreaded Manual', value: SelType.MultiThreaded },
        { label: 'Singlethreaded Enum', value: SelType.EnumSingleThreaded},
        { label: 'Multithreaded Enum', value: SelType.EnumMultiThreaded},
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
