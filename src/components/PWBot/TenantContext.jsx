import { createContext, useContext } from "react";
import defaultTenant from "./default";

const TenantContext = createContext(defaultTenant);

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ children, tenant = defaultTenant }) {
    return (
        <TenantContext.Provider value={tenant}>
            {children}
        </TenantContext.Provider>
    );
}
