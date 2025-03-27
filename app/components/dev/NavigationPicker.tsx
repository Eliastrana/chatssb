'use client';
import React, {useState} from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";
import {NavType} from "@/app/types";

interface NavigationPickerProps {
    onSelectNavigation: (model: NavType) => void;
}

const NavigationPicker: React.FC<NavigationPickerProps> = ({ onSelectNavigation }) => {
    const navigationOptions: DropdownOption<NavType>[] = [
        { label: 'Parallell 1', value: NavType.Parallell_1 },
        { label: 'Parallell 2', value: NavType.Parallell_2 },
        { label: 'Parallell 3', value: NavType.Parallell_3 },
    ];

    const [navigation, setNavigation] = useState<NavType>(navigationOptions[0].value);


    const handleSelect = (value: NavType) => {
        setNavigation(value);
        onSelectNavigation(value);
    }

    return (
        <div className="">
            <CustomDropdown
                options={navigationOptions}
                selectedValue={navigation}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default NavigationPicker;
