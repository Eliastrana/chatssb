'use client';
import React from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";
import {ModelType} from "@/app/types";

interface ModelPickerProps {
    selectedModel: ModelType;
    onSelectModel: (model: ModelType) => void;
}

const ModelPicker: React.FC<ModelPickerProps> = ({ selectedModel, onSelectModel }) => {
    const ModelOptions: DropdownOption<ModelType>[] = [
        { label: 'GPT-4o-mini', value: ModelType.GPT4oMini },
        { label: 'GPT-o3-mini', value: ModelType.GPTo3Mini },
        { label: 'Gemini Flash 2', value: ModelType.GeminiFlash2 },
        { label: 'Gemini Flash 2 Lite', value: ModelType.GeminiFlash2Lite },
        { label: 'Gemini 2.5 Pro Exp', value: ModelType.Gemini2_5ProExp },
        { label: 'Llama 3.3 70b', value: ModelType.Llama3_3_70b },
        // { label: 'Llama 3.1 8b', value: ModelType.Llama3_1_8b },
        { label: 'Deepseek R1 70b', value: ModelType.DeepseekR1_70b },
        { label: 'GPT-4.1-nano', value: ModelType.GPT4_1Nano},
        { label: 'GPT-4.1', value: ModelType.GPT4_1},
        { label: 'GPT-4.1-mini', value: ModelType.GPT4_1Mini},
    ];

    const handleSelect = (model: ModelType) => {
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
