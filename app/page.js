'use client';

import { useState } from 'react';
import { Search, Download, Loader2, Database, Globe } from 'lucide-react';

export default function Dashboard() {
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!niche || !location) return;

    setLoading(true);
    setLeads([]);
    setSource('');
    setStatus('Querying maps data and finding matching directories...');

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location }),
      });

      const result = await res.json();
      if (res.ok) {
        setLeads(result.data || []);
        setSource(result.source || 'api');
      } else {
        alert(result.error || 'Something went wrong');
      }
    } catch (err) {
      alert('Failed to connect to the backend API.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Company Name', 'Website', 'Email', 'Phone', 'Address'];
    const rows = leads.map(lead => [
      `"${lead.company_name.replace(/"/g, '""')}"`,
      `"${lead.website.replace(/"/g, '""')}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.phone.replace(/"/g, '""')}"`,
      `"${lead.address.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${niche || 'export'}_${location || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">B2B Lead Finder Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Acquire localized platform contacts automatically.</p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg transition"
          >
            <Download size={18} />
            Export Data to CSV
          </button>
        )}
      </header>

      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <input
          type="text"
          placeholder="Niche (e.g. Roofers)"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sky-500 transition"
          required
        />
        <input
          type="text"
          placeholder="Location (e.g. Austin)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sky-500 transition"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 font-semibold text-white rounded-lg px-4 py-2.5 transition cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {loading ? 'Processing...' : 'Search Leads'}
        </button>
      </form>

      {status && (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-300">
          <Loader2 className="animate-spin text-sky-500" size={18} />
          <span className="text-sm">{status}</span>
        </div>
      )}

      {source && (
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          {source === 'cache' ? (
            <>
              <Database size={12} className="text-purple-400" />
              <span className="text-purple-300">Loaded from local cache memory (0 quota used)</span>
            </>
          ) : (
            <>
              <Globe size={12} className="text-sky-400" />
              <span className="text-sky-300">Fresh search processed via network engine</span>
            </>
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-300 text-xs font-semibold tracking-wider">
              <th className="p-4">Company Name</th>
              <th className="p-4">Website</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {leads.map((lead, index) => (
              <tr key={index} className="hover:bg-slate-950/30 transition">
                <td className="p-4 font-medium text-white">{lead.company_name}</td>
                <td className="p-4">
                  {lead.website !== 'N/A' ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline max-w-[200px] truncate block">
                      {lead.website}
                    </a>
                  ) : '—'}
                </td>
                <td className="p-4">
                  {lead.email !== 'N/A' ? (
                    <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-xs font-mono">
                      {lead.email}
                    </span>
                  ) : '—'}
                </td>
                <td className="p-4">{lead.phone !== 'N/A' ? lead.phone : '—'}</td>
                <td className="p-4 text-xs text-slate-400 max-w-[250px] truncate">{lead.address !== 'N/A' ? lead.address : '—'}</td>
              </tr>
            ))}
            {!loading && leads.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500 text-sm">
                  No directory records loaded. Enter your parameters above to initiate extraction.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
