"use client";

interface HeadingProps {
  teamName?: string;
  userName?: string;
}

export default function Heading({ teamName, userName }: HeadingProps) {
  console.log("tam name",teamName)
  return (
    <header className="text-center sm:text-sm md:text-sm">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        <span className="text-blue-600 heading dark:text-shadow-2xs">
          Loan & Investment
        </span>
      </h1>
      
      {/* Display Team Name and User Name if available */}
      {(teamName || userName) && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {teamName && (
            <span className="mr-4">
              <strong>Team:</strong> {teamName}
            </span>
          )}
          {userName && (
            <span>
              <strong>User:</strong> {userName}
            </span>
          )}
        </div>
      )}
    </header>
  );
}