'use client';
import React, {useState} from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";
import {ModelType} from "@/app/types";

interface ModelPickerProps {
    onSelectModel: (model: ModelType) => void;
}

const ModelPicker: React.FC<ModelPickerProps> = ({ onSelectModel }) => {
    const ModelOptions: DropdownOption<ModelType>[] = [
        { label: 'GPT-4o-mini', value: ModelType.GPT4oMini },
        { label: 'GPT-o3-mini', value: ModelType.GPTo3Mini },
        { label: 'Gemini Flash 2 Lite', value: ModelType.GeminiFlash2Lite },
        { label: 'Llama 3.3 70b', value: ModelType.Llama33_70b },
        { label: 'Llama 3.2 1b', value: ModelType.Llama32_1b },
        { label: 'Deepseek R1 70b', value: ModelType.DeepseekR1_70b },
    ];

    const [selectedModel, setSelectedModel] = useState<ModelType>(ModelOptions[0].value);

    const handleSelect = (model: ModelType) => {
        setSelectedModel(model);
        onSelectModel(model);
    };

    return (
        <div className="">
            <CustomDropdown
                options={ModelOptions}
                selectedValue={selectedModel}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default ModelPicker;
