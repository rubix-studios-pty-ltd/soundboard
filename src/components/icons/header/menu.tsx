import React from "react"

export const Menu = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    {...props}
  >
    <rect x="2" y="4" width="12" height="1" />
    <rect x="2" y="8" width="12" height="1" />
    <rect x="2" y="12" width="12" height="1" />
  </svg>
)
