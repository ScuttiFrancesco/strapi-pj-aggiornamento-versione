import React from 'react';

// Inline tree icon to avoid dependency on unavailable icon exports
const PluginIcon: React.FC = () => (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Tree View Plugin"
	>
		<path
			d="M11 3a1 1 0 0 1 2 0v2h3a2 2 0 0 1 2 2v2h-2V7h-3v4h3a2 2 0 0 1 2 2v2h-2v-2h-3v6h-2v-6H8v2H6v-2a2 2 0 0 1 2-2h3V7H8v2H6V7a2 2 0 0 1 2-2h3V3Z"
			fill="currentColor"
		/>
	</svg>
);

export default PluginIcon;
