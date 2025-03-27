'use client';
import React from 'react';
import { CustomDropdown, DropdownOption } from "@/app/components/Graphing/util/CustomDropdown";
import { NavType } from "@/app/types";

interface NavigationPickerProps {
    selectedNavigation: NavType;
    onSelectNavigation: (nav: NavType) => void;
}

const NavigationPicker: React.FC<NavigationPickerProps> = ({ selectedNavigation, onSelectNavigation }) => {
    const navigationOptions: DropdownOption<NavType>[] = [
        { label: 'Parallell 1', value: NavType.Parallell_1 },
        { label: 'Parallell 2', value: NavType.Parallell_2 },
        { label: 'Parallell 3', value: NavType.Parallell_3 },
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
