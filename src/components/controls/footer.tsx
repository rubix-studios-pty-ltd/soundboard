import React from "react"

const Footer: React.FC = () => {
  return (
    <footer className="flex items-center justify-between border-t border-[#333333] bg-[#1a1a1a] p-1">
      <p className="p-1 text-[9px] text-white">
        <span className="mr-0.5">&copy;2025</span>
        <a
          href="https://www.rubixstudios.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-white no-underline transition-colors hover:text-gray-300"
        >
          Rubix Studios
        </a>
      </p>
    </footer>
  )
}

export default Footer
