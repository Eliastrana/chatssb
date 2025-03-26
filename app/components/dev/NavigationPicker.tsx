'use client';
import React, {useState} from 'react';
import {CustomDropdown, DropdownOption} from "@/app/components/Graphing/util/CustomDropdown";
import {NavType} from "@/app/types";

interface NavigationPickerProps {
    onSelectNavigation: (model: NavType) => void;
}

const NavigationPicker: React.FC<NavigationPickerProps> = ({ onSelectNavigation }) => {
    const navigationOptions: DropdownOption<NavType>[] = [
        { label: 'Parallell', value: NavType.Parallell }
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
