'use client';

export default function Footer() {
    return (
        <footer className="bg-black border-t border-yellow-500/10 py-4">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-gray-500 text-sm">
                    © {new Date().getFullYear()} CronoStudio
                </p>
            </div>
        </footer>
    );
}
