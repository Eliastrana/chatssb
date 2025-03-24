'use client';
import React, { useState } from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";

interface LLMPickerProps {
    onSelectModel: (model: string) => void;
}

const SearchPicker: React.FC<LLMPickerProps> = ({ onSelectModel }) => {
    const llmOptions: DropdownOption<string>[] = [
        { label: 'Singlethreaded', value: 'singlethreaded' },
        { label: 'Multithreaded', value: 'multithreaded' }
    ];

    const [selectedModel, setSelectedModel] = useState<string>(llmOptions[0].value);

    const handleSelect = (model: string) => {
        setSelectedModel(model);
        onSelectModel(model);
    };

    return (
        <div className="">
            <CustomDropdown
                options={llmOptions}
                selectedValue={selectedModel}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default SearchPicker;
