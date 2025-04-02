import React, { ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  text: string
}

const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  return (
    <div className="group relative inline-block">
      <div className="cursor-help">
        {children}
      </div>
      <div className="
        invisible group-hover:visible 
        absolute z-10 
        bg-gray-800 text-white 
        text-xs rounded 
        py-1 px-2 
        bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1
        opacity-0 group-hover:opacity-100 
        transition-all duration-300
      ">
        {text}
      </div>
    </div>
  )
}

export default Tooltip