import React from "react";
import Header from "../components/Header";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div>
            <Header />
            <main>{children}</main>
        </div>
    );
};

export default MainLayout;
