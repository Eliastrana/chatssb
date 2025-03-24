'use client';
import React, { useState } from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";

interface LLMPickerProps {
    onSelectModel: (model: string) => void;
}

const ParameterPicker: React.FC<LLMPickerProps> = ({ onSelectModel }) => {
    const llmOptions: DropdownOption<string>[] = [
        { label: 'Veldig bestemt', value: 'veldig_bestemt' },
        { label: 'Litt usikker', value: 'litt_usikker' },

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

export default ParameterPicker;
