import React, { useEffect, useState } from 'react';
import TreeView from '../../components/TreeView';
import pluginId from '../../pluginId';

interface NodeData {
  id: number | string;
  label: string;
  children?: NodeData[];
}

interface ContentType {
  uid: string;
  displayName: string;
  kind: string;
  attributes: Record<string, any>;
}

const DEFAULTS = {
  contentType: '',
  parentField: '',
  labelField: '',
};

const App: React.FC = () => {
  const [query, setQuery] = useState(DEFAULTS);
  const [data, setData] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loadingCTs, setLoadingCTs] = useState(true);

  // Fetch available content types
  const fetchContentTypes = async () => {
    try {
      console.log('🔍 Fetching content types...');
      const response = await fetch('/admin/content-manager/content-types');
      console.log('📡 Content types response status:', response.status);
      
      const responseText = await response.text();
      console.log('📄 Content types raw response (first 300 chars):', responseText.substring(0, 300));
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('❌ JSON parse error for content types:', parseErr);
        // Fallback: add known content types manually
        setContentTypes([
          { uid: 'api::pagina.pagina', displayName: 'Pagina', kind: 'collectionType', attributes: {} },
          { uid: 'api::comunicati-stampa.comunicati-stampa', displayName: 'Comunicati Stampa', kind: 'collectionType', attributes: {} },
          { uid: 'api::configuratore.configuratore', displayName: 'Configuratore', kind: 'collectionType', attributes: {} },
          { uid: 'api::office.office', displayName: 'Office', kind: 'collectionType', attributes: {} },
          { uid: 'api::tag.tag', displayName: 'Tag', kind: 'collectionType', attributes: {} },
        ]);
        return;
      }
      
      console.log('📋 Available content types result:', result);
      
      if (result.data) {
        // Filter only collection types (not single types)
        const collections = result.data.filter((ct: ContentType) => ct.kind === 'collectionType');
        setContentTypes(collections);
        console.log('📊 Collection types found:', collections.length, collections.map(c => c.uid));
      } else {
        console.warn('⚠️ No data property in content types response');
        // Fallback
        setContentTypes([
          { uid: 'api::pagina.pagina', displayName: 'Pagina', kind: 'collectionType', attributes: {} },
        ]);
      }
    } catch (err) {
      console.error('❌ Error fetching content types:', err);
      // Fallback: add known content types manually
      setContentTypes([
        { uid: 'api::pagina.pagina', displayName: 'Pagina', kind: 'collectionType', attributes: {} },
        { uid: 'api::comunicati-stampa.comunicati-stampa', displayName: 'Comunicati Stampa', kind: 'collectionType', attributes: {} },
        { uid: 'api::configuratore.configuratore', displayName: 'Configuratore', kind: 'collectionType', attributes: {} },
        { uid: 'api::office.office', displayName: 'Office', kind: 'collectionType', attributes: {} },
        { uid: 'api::tag.tag', displayName: 'Tag', kind: 'collectionType', attributes: {} },
      ]);
    } finally {
      setLoadingCTs(false);
    }
  };

  const testEndpoint = async () => {
    try {
      console.log('🧪 Testing plugin endpoint...');
      const response = await fetch('/admin/plugins/tree-view/ping');
      console.log('🧪 Test response status:', response.status);
      
      const responseText = await response.text();
      console.log('🧪 Test response:', responseText);
      
      if (response.ok) {
        alert('✅ Plugin endpoint funziona! ' + responseText);
      } else {
        alert('❌ Plugin endpoint non funziona: ' + response.status);
      }
    } catch (err) {
      console.error('❌ Error testing endpoint:', err);
      alert('❌ Errore nel test: ' + err.message);
    }
  };

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('contentType', query.contentType);
      if (query.parentField) params.set('parentField', query.parentField);
      if (query.labelField) params.set('labelField', query.labelField);
      
      const url = `/admin/plugins/tree-view/tree?${params.toString()}`;
      console.log('🔍 Fetching tree from:', url);
      
      const res = await fetch(url);
      console.log('📡 Response status:', res.status);
      console.log('📋 Response headers:', res.headers);
      
      const responseText = await res.text();
      console.log('📄 Raw response (first 200 chars):', responseText.substring(0, 200));
      
      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('❌ JSON parse error:', parseErr);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${json.message || 'Unknown error'}`);
      }
      
      setData(json.data || []);
      console.log('✅ Tree data loaded:', json.data?.length || 0, 'nodes');
    } catch (e: any) {
      console.error('❌ Error fetching tree:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentTypes();
  }, []);

  const selectedCT = contentTypes.find(ct => ct.uid === query.contentType);

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: 0 }}>Tree View</h2>
      <p style={{ marginTop: 4, color: '#666' }}>Visualizza gerarchie self-reference per qualsiasi collection</p>
      
      <div style={{ marginTop: '1.5rem', background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {loadingCTs ? (
            <div>Caricamento content types...</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Content Type:</label>
                <select
                  value={query.contentType}
                  onChange={(e) => setQuery(q => ({ ...q, contentType: e.target.value }))}
                  style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, minWidth: '200px' }}
                >
                  <option value="">Seleziona un content type...</option>
                  {contentTypes.map(ct => (
                    <option key={ct.uid} value={ct.uid}>
                      {ct.displayName} ({ct.uid})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Campo Parent (opzionale):</label>
                <input
                  name="parentField"
                  placeholder="Auto-rilevato se vuoto"
                  value={query.parentField}
                  onChange={(e) => setQuery(q => ({ ...q, parentField: e.target.value }))}
                  style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Campo Label (opzionale):</label>
                <input
                  name="labelField"
                  placeholder="Auto: title, titolo, name, label, id"
                  value={query.labelField}
                  onChange={(e) => setQuery(q => ({ ...q, labelField: e.target.value }))}
                  style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4 }}
                />
              </div>

              <button
                onClick={fetchTree}
                disabled={loading || !query.contentType}
                style={{
                  padding: '8px 16px',
                  background: query.contentType ? '#4945ff' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: query.contentType ? 'pointer' : 'not-allowed',
                  opacity: loading ? 0.6 : 1,
                  marginTop: '18px',
                }}
              >
                {loading ? 'Caricamento...' : 'Genera Albero'}
              </button>

              <button
                onClick={testEndpoint}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  marginTop: '18px',
                  marginLeft: '8px',
                }}
              >
                🧪 Test Plugin
              </button>
            </>
          )}
        </div>

        {selectedCT && (
          <div style={{ marginTop: 12, padding: 8, background: '#f8f9fa', borderRadius: 4, fontSize: '12px' }}>
            <strong>Campi disponibili:</strong> {Object.keys(selectedCT.attributes).join(', ')}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, color: '#c62626', fontSize: 12, padding: 8, background: '#fff5f5', borderRadius: 4 }}>
            <strong>Errore:</strong> {error}
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        {loading ? (
          <div>Caricamento albero...</div>
        ) : data.length === 0 ? (
          <div>Nessun nodo trovato. {query.contentType ? 'Prova a verificare che ci siano dati nella collection.' : 'Seleziona un content type per iniziare.'}</div>
        ) : (
          <TreeView data={data} />
        )}
      </div>
    </div>
  );
};

export default App;

