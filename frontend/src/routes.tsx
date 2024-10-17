import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";

const AppRoutes: React.FC = () => {
    return (
        <Router>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </MainLayout>
        </Router>
    );
};

export default AppRoutes;
