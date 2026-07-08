import { useState, createContext } from 'react';

export const ModalContext = createContext(null);

export default function ModalProvider({ children }) {
  const [modal, setModal] = useState({
    title: '',
    content: null,
    confirmText: 'Aceptar',
    onSubmit: undefined,
    open: false,
    variant: '',
    secondaryBtnText: '',
    secondaryBtnHandler: undefined,
  });

  const contextValue = {
    modal,
    show: ({
      title,
      content,
      confirmText,
      onSubmit,
      variant,
      secondaryBtnText,
      secondaryBtnHandler,
    }) => {
      setModal({
        ...modal,
        title,
        open: true,
        content,
        confirmText,
        onSubmit,
        variant,
        secondaryBtnText,
        secondaryBtnHandler,
      });
    },
    remove: () => {
      setModal({
        ...modal,
        open: false,
        onSubmit: undefined,
        secondaryBtnHandler: undefined,
      });
    },
  };

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
}
