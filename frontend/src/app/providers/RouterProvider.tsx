import { BrowserRouter } from 'react-router-dom';

interface RouterProviderProps {
    children: React.ReactNode;
}

export default function RouterProvider({ children }: RouterProviderProps) {
    return <BrowserRouter>{children}</BrowserRouter>;
}
