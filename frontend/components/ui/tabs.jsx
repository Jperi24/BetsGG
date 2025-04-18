// components/ui/SimpleTabs.jsx
import React, { useState } from "react";

export const Tabs = ({ children, defaultValue, value, onValueChange, className = "" }) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue);
  
  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Find the content for the active tab
  const activeContent = React.Children.toArray(children).find(
    (child) => child.props.value === activeTab
  );

  // Filter out the TabsList from children
  const tabsList = React.Children.toArray(children).find(
    (child) => child.type.displayName === "TabsList"
  );

  // Clone TabsList with additional props
  const clonedTabsList = tabsList
    ? React.cloneElement(tabsList, {
        activeTab,
        onTabChange: handleTabChange,
      })
    : null;

  return (
    <div className={className}>
      {clonedTabsList}
      {activeContent}
    </div>
  );
};

export const TabsList = ({ children, activeTab, onTabChange, className = "" }) => {
  // Clone the TabsTrigger components with additional props
  const clonedTriggers = React.Children.map(children, (child) => {
    if (child.type.displayName === "TabsTrigger") {
      return React.cloneElement(child, {
        active: activeTab === child.props.value,
        onSelect: () => onTabChange(child.props.value),
      });
    }
    return child;
  });

  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-600 ${className}`}>
      {clonedTriggers}
    </div>
  );
};
TabsList.displayName = "TabsList";

export const TabsTrigger = ({ children, value, active, onSelect, className = "" }) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
        active
          ? "bg-white text-indigo-700 shadow-sm"
          : "text-gray-600 hover:text-gray-700"
      } ${className}`}
      onClick={onSelect}
    >
      {children}
    </button>
  );
};
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = ({ children, value, className = "" }) => {
  return (
    <div className={`mt-2 focus:outline-none ${className}`}>
      {children}
    </div>
  );
};
TabsContent.displayName = "TabsContent";