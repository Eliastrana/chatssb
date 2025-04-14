'use client';
import React from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";
import {NavType} from "@/app/types";

interface NavigationPickerProps {
    selectedNavigation: NavType;
    onSelectNavigation: (nav: NavType) => void;
}

const NavigationPicker: React.FC<NavigationPickerProps> = ({ selectedNavigation, onSelectNavigation }) => {
    const navigationOptions: DropdownOption<NavType>[] = [
        { label: 'Parallell 1', value: NavType.FolderNavigation_1 },
        { label: 'Parallell 2', value: NavType.FolderNavigation_2 },
        { label: 'Parallell 3', value: NavType.FolderNavigation_3 },
        { label: 'Parallell 4', value: NavType.FolderNavigation_4 },
        { label: 'Parallell 5', value: NavType.FolderNavigation_5 },
        { label: 'Keyword 1', value: NavType.KeywordSearch_1 },
        { label: 'Keyword 2', value: NavType.KeywordSearch_2 },
        { label: 'Keyword 3', value: NavType.KeywordSearch_3 },
        { label: 'Keyword 4', value: NavType.KeywordSearch_4 },
        { label: 'Keyword 5', value: NavType.KeywordSearch_5 },
    ];

    const handleSelect = (value: NavType) => {
        onSelectNavigation(value);
    };

    return (
        <div className="">
            <CustomDropdown
                options={navigationOptions}
                selectedValue={selectedNavigation}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default NavigationPicker;
