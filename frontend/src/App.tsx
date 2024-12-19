// App.tsx
import React from "react";
import { UserProvider } from './contexts/UserContext';
import AppRoutes from "./routes";

const App: React.FC = () => {
  return (
    <UserProvider>
      <div className="App">
        <AppRoutes />
      </div>
    </UserProvider>
  );
};

export default App;
