import React, { createContext, useContext } from "react";

export const DragContext = createContext();

export const useDrag = () => useContext(DragContext);

export const DragProvider = ({ onDropAnswer, children }) => {
  return (
    <DragContext.Provider value={{ onDropAnswer }}>
      {children}
    </DragContext.Provider>
  );
};
