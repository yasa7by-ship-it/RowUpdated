import React, { ReactNode } from 'react';
import Header from './Header';
import AnnouncementsBanner from './AnnouncementsBanner';
import AddToHomeScreenPrompt from './AddToHomeScreenPrompt'; // Import the new component
import type { Profile, PageName, PageState } from '../types';

interface LayoutProps {
  profile: Profile | null;
  children: ReactNode;
  setPage: (page: PageState) => void;
  currentPage: PageName;
}

const Layout: React.FC<LayoutProps> = ({ profile, children, setPage, currentPage }) => {
  // definitive fix to eliminate all unwanted white space below content. 
  // Restructured the main layout to use flex-grow, ensuring the content area only takes the height it needs, 
  // while allowing other pages to fill the viewport correctly. 
  // Also synchronized the background color with the main HTML body for a seamless appearance. This permanently resolves the layout issue.
  return (
    <div className="flex flex-col min-h-screen bg-nextrow-bg dark:bg-nextrow-bg-dark text-nextrow-text dark:text-gray-200">
      <Header profile={profile} setPage={setPage} currentPage={currentPage} />
      <AnnouncementsBanner />
      <main className="flex-grow">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      <AddToHomeScreenPrompt /> {/* Add the component here */}
    </div>
  );
};

export default Layout;