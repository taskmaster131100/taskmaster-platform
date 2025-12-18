import React, { createContext, useContext, useState } from 'react';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
}

const OrganizationContext = createContext<OrganizationContextType>({ 
  currentOrganization: null 
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization] = useState<Organization | null>(null);

  return (
    <OrganizationContext.Provider value={{ currentOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
