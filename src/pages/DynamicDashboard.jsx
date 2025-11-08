import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageList from '../components/PageList';
import SectionList from '../components/SectionList';
import FieldList from '../components/FieldList';

const DynamicDashboard = () => {
  const [searchParams] = useSearchParams();
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [selectedPageName, setSelectedPageName] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedSectionName, setSelectedSectionName] = useState(null);

  // Check URL params for page and user selection
  useEffect(() => {
    const pageIdFromUrl = searchParams.get('page');
    if (pageIdFromUrl) {
      // Page will be selected by PageList component when it loads
      // We just need to set the ID here
      setSelectedPageId(pageIdFromUrl);
    } else {
      // If no page in URL, clear selection
      setSelectedPageId(null);
      setSelectedPageName(null);
      setSelectedSectionId(null);
      setSelectedSectionName(null);
    }
  }, [searchParams]);

  const handlePageSelect = (pageId, pageName) => {
    setSelectedPageId(pageId);
    setSelectedPageName(pageName);
    setSelectedSectionId(null);
    setSelectedSectionName(null);
  };

  const handleSectionSelect = (sectionId, sectionName) => {
    setSelectedSectionId(sectionId);
    setSelectedSectionName(sectionName);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Sidebar - Pages */}
      <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-2 overflow-y-auto">
        <PageList
          onPageSelect={handlePageSelect}
          selectedPageId={selectedPageId}
          userId={searchParams.get('user')}
        />
      </div>

      {/* Middle - Sections */}
      <div className="w-96 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-2 overflow-y-auto">
        <SectionList
          pageId={selectedPageId}
          pageName={selectedPageName}
          onSectionSelect={handleSectionSelect}
          selectedSectionId={selectedSectionId}
        />
      </div>

      {/* Main - Fields */}
      <div className="flex-1 bg-white dark:bg-gray-900 p-2 overflow-y-auto">
        <FieldList
          sectionId={selectedSectionId}
          sectionName={selectedSectionName}
        />
      </div>
    </div>
  );
};

export default DynamicDashboard;

