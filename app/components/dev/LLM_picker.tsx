'use client';
import React, { useState } from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";

interface LLMPickerProps {
    onSelectModel: (model: string) => void;
}

const LLM_picker: React.FC<LLMPickerProps> = ({ onSelectModel }) => {
    const llmOptions: DropdownOption<string>[] = [
        { label: 'GPT-4o-mini', value: 'GPT-4o-mini' },
        { label: 'GPT-o3-mini', value: 'GPT-o3-mini' },
        { label: 'Gemini Flash 2', value: 'Gemini Flash 2' },
        { label: 'DeepSeek r1', value: 'DeepSeek r1' },
    ];

    const [selectedModel, setSelectedModel] = useState<string>(llmOptions[0].value);

    const handleSelect = (model: string) => {
        setSelectedModel(model);
        onSelectModel(model);
    };

    return (
        <div className="fixed left-20 top-4 max-w-xs">
            <CustomDropdown
                options={llmOptions}
                selectedValue={selectedModel}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default LLM_picker;
