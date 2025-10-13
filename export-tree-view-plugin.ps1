# ============================================================================
# Script di Esportazione Plugin Tree-View e Dipendenze
# ============================================================================
# Esporta il plugin tree-view personalizzato e tutte le feature correlate
# utilizzate nel progetto Strapi
# ============================================================================

param(
    [string]$DestinationPath = ".\tree-view-export",
    [switch]$IncludeTimestamp = $false
)

# Funzioni helper per output colorato
function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

# Aggiungi timestamp se richiesto
if ($IncludeTimestamp) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $DestinationPath = "$DestinationPath`_$timestamp"
}

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  Export Tree-View Plugin & Dependencies" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# Crea la directory di destinazione
if (Test-Path $DestinationPath) {
    Write-Warning "La cartella di destinazione esiste gia: $DestinationPath"
    $response = Read-Host "Vuoi sovrascriverla? (s/n)"
    if ($response -ne "s") {
        Write-Error "Operazione annullata"
        exit
    }
    Remove-Item -Path $DestinationPath -Recurse -Force
}

New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
Write-Success "[OK] Cartella di destinazione creata: $DestinationPath"
Write-Host ""

# ============================================================================
# 1. PLUGIN TREE-VIEW (completo)
# ============================================================================
Write-Step "[1/9] Esportazione Plugin Tree-View..."

$pluginSource = ".\src\plugins\tree-view"
$pluginDest = "$DestinationPath\src\plugins\tree-view"

if (Test-Path $pluginSource) {
    Copy-Item -Path $pluginSource -Destination $pluginDest -Recurse -Force
    Write-Success "  [OK] Plugin tree-view copiato"
    
    $fileCount = (Get-ChildItem -Path $pluginDest -Recurse -File).Count
    Write-Host "  File copiati: $fileCount"
} else {
    Write-Error "  [ERRORE] Plugin tree-view non trovato in $pluginSource"
}

Write-Host ""

# ============================================================================
# 2. PLUGIN PAGINA-LIFECYCLE (se utilizzato dal tree-view)
# ============================================================================
Write-Step "[2/9] Esportazione Plugin Pagina-Lifecycle..."

$lifecycleSource = ".\src\plugins\pagina-lifecycle"
$lifecycleDest = "$DestinationPath\src\plugins\pagina-lifecycle"

if (Test-Path $lifecycleSource) {
    Copy-Item -Path $lifecycleSource -Destination $lifecycleDest -Recurse -Force
    Write-Success "  [OK] Plugin pagina-lifecycle copiato"
    
    $fileCount = (Get-ChildItem -Path $lifecycleDest -Recurse -File).Count
    Write-Host "  File copiati: $fileCount"
} else {
    Write-Warning "  [WARN] Plugin pagina-lifecycle non trovato (potrebbe non essere necessario)"
}

Write-Host ""

# ============================================================================
# 3. ENDPOINT CUSTOM SUBTREE (routes + controller)
# ============================================================================
Write-Step "[3/9] Esportazione Endpoint Custom Subtree..."

# Routes custom
$routesSource = ".\src\api\pagina\routes\0-custom-pagina.ts"
$routesDest = "$DestinationPath\src\api\pagina\routes"

if (Test-Path $routesSource) {
    New-Item -ItemType Directory -Path $routesDest -Force | Out-Null
    Copy-Item -Path $routesSource -Destination $routesDest -Force
    Write-Success "  [OK] Routes custom copiate (0-custom-pagina.ts)"
} else {
    Write-Error "  [ERRORE] File routes non trovato: $routesSource"
}

# Controller pagina (contiene getSubtree, getTree, getChildren)
$controllerSource = ".\src\api\pagina\controllers\pagina.ts"
$controllerDest = "$DestinationPath\src\api\pagina\controllers"

if (Test-Path $controllerSource) {
    New-Item -ItemType Directory -Path $controllerDest -Force | Out-Null
    Copy-Item -Path $controllerSource -Destination $controllerDest -Force
    Write-Success "  [OK] Controller pagina copiato (contiene getSubtree)"
} else {
    Write-Error "  [ERRORE] Controller non trovato: $controllerSource"
}

Write-Host ""

# ============================================================================
# 4. CONTENT-TYPE PAGINA (schema necessario per il tree-view)
# ============================================================================
Write-Step "[4/9] Esportazione Content-Type Pagina..."

$contentTypeSource = ".\src\api\pagina\content-types"
$contentTypeDest = "$DestinationPath\src\api\pagina\content-types"

if (Test-Path $contentTypeSource) {
    Copy-Item -Path $contentTypeSource -Destination $contentTypeDest -Recurse -Force
    Write-Success "  [OK] Content-type pagina copiato"
} else {
    Write-Warning "  [WARN] Content-type pagina non trovato"
}

Write-Host ""

# ============================================================================
# 5. SERVICES PAGINA (se presenti)
# ============================================================================
Write-Step "[5/9] Esportazione Services Pagina (opzionale)..."

$servicesSource = ".\src\api\pagina\services"
$servicesDest = "$DestinationPath\src\api\pagina\services"

if (Test-Path $servicesSource) {
    Copy-Item -Path $servicesSource -Destination $servicesDest -Recurse -Force
    Write-Success "  [OK] Services pagina copiati"
} else {
    Write-Warning "  [WARN] Services pagina non trovati (potrebbero non essere necessari)"
}

Write-Host ""

# ============================================================================
# 6. COMPONENTI DYNAMIC ZONE (layout, config)
# ============================================================================
Write-Step "[6/10] Esportazione Componenti Dynamic Zone..."

$componentsSource = ".\src\components"
$componentsDest = "$DestinationPath\src\components"

if (Test-Path $componentsSource) {
    Copy-Item -Path $componentsSource -Destination $componentsDest -Recurse -Force
    Write-Success "  [OK] Componenti copiati (layout, config, ecc.)"
    
    $compCount = (Get-ChildItem -Path $componentsDest -Recurse -File).Count
    Write-Host "  File copiati: $compCount"
} else {
    Write-Warning "  [WARN] Cartella components non trovata"
}

Write-Host ""

# ============================================================================
# 7. CONFIGURAZIONE PLUGINS
# ============================================================================
Write-Step "[7/10] Esportazione Configurazione Plugins..."

$pluginsConfigSource = ".\config\plugins.ts"
$pluginsConfigDest = "$DestinationPath\config"

if (Test-Path $pluginsConfigSource) {
    New-Item -ItemType Directory -Path $pluginsConfigDest -Force | Out-Null
    Copy-Item -Path $pluginsConfigSource -Destination $pluginsConfigDest -Force
    Write-Success "  [OK] Configurazione plugins copiata"
} else {
    Write-Warning "  [WARN] File plugins.ts non trovato"
}

Write-Host ""

# ============================================================================
# 8. PACKAGE.JSON (dipendenze del plugin)
# ============================================================================
Write-Step "[8/10] Creazione package.json con dipendenze..."

$packageJsonContent = @"
{
  "name": "tree-view-plugin-export",
  "version": "1.0.0",
  "description": "Export del plugin tree-view e dipendenze per Strapi",
  "main": "index.js",
  "exports": {
    "./strapi-admin": "./src/plugins/tree-view/strapi-admin.js",
    "./strapi-server": "./src/plugins/tree-view/strapi-server.js"
  },
  "dependencies": {
    "@strapi/strapi": "^5.16.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "strapi-plugin-multi-select": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  },
  "strapi": {
    "name": "tree-view",
    "displayName": "Tree View",
    "description": "Plugin per visualizzare contenuti in struttura ad albero",
    "kind": "plugin"
  }
}
"@

Set-Content -Path "$DestinationPath\package.json" -Value $packageJsonContent
Write-Success "  [OK] package.json creato"

Write-Host ""

# ============================================================================
# 9. README con istruzioni di installazione
# ============================================================================
Write-Step "[9/10] Creazione README con istruzioni..."

$readmeContent = @"
# Tree-View Plugin Export

## Contenuto del Package

Questo export contiene:

1. **Plugin Tree-View** (src/plugins/tree-view/)
   - Componenti React per l'interfaccia admin
   - Server routes e controllers
   - Services per la gestione dell'albero

2. **Plugin Pagina-Lifecycle** (src/plugins/pagina-lifecycle/)
   - Lifecycle hooks per il content-type pagina

3. **Endpoint Custom Subtree**
   - Routes custom (src/api/pagina/routes/0-custom-pagina.ts)
   - Controller con funzioni getSubtree, getTree, getChildren

4. **Content-Type Pagina** (src/api/pagina/content-types/)
   - Schema del content-type necessario per il plugin

5. **Componenti Dynamic Zone** (src/components/)
   - layout.articolo, layout.titolo
   - config.tabella

6. **Configurazione** (config/plugins.ts)

---

## Dipendenze Richieste

Il progetto di destinazione DEVE avere queste dipendenze installate:

``````bash
npm install strapi-plugin-multi-select@^2.1.1
``````

Dipendenze base (gia presenti in Strapi 5):
- react ^18.0.0
- react-dom ^18.0.0
- typescript ^5

---

## Installazione

### 1. Installa le dipendenze mancanti

``````bash
cd /path/to/progetto/strapi
npm install strapi-plugin-multi-select@^2.1.1
``````

### 2. Copia i file nel progetto Strapi

``````powershell
# Copia il plugin tree-view
Copy-Item -Path ".\src\plugins\tree-view" -Destination "PATH_TO_STRAPI\src\plugins\tree-view" -Recurse

# Copia il plugin pagina-lifecycle (se presente)
Copy-Item -Path ".\src\plugins\pagina-lifecycle" -Destination "PATH_TO_STRAPI\src\plugins\pagina-lifecycle" -Recurse

# Copia l'API pagina
Copy-Item -Path ".\src\api\pagina" -Destination "PATH_TO_STRAPI\src\api\pagina" -Recurse

# Copia i componenti dynamic zone
Copy-Item -Path ".\src\components" -Destination "PATH_TO_STRAPI\src\components" -Recurse
``````

### 3. Configura i plugin

Aggiungi/modifica il file config/plugins.ts:

``````typescript
export default {
  'tree-view': {
    enabled: true,
    resolve: './src/plugins/tree-view'
  },
  'pagina-lifecycle': {
    enabled: true,
    resolve: './src/plugins/pagina-lifecycle'
  },
  'multi-select': {
    enabled: true,
  },
};
``````

### 4. Rebuild dell'admin panel

``````bash
npm run build
npm run develop
``````

---

## Endpoint Disponibili

### Tree View Endpoint

- GET /api/pagina/:slug/tree - Ottiene l'albero genealogico completo
- GET /api/pagina/:slug/children - Ottiene solo i figli diretti
- GET /api/pagina/subtree/:slug - Ottiene il sotto-albero completo

### Query Parameters per Subtree

- maxDeep: Limita la profondita dell'albero (default: infinito)
  
  Esempio: /api/pagina/subtree/home?maxDeep=2

---

## Troubleshooting

### Errore: Cannot find module 'strapi-plugin-multi-select'

``````bash
npm install strapi-plugin-multi-select@^2.1.1
npm run build
``````

### Errore: Component 'layout.articolo' not found

Assicurati di aver copiato la cartella src/components con tutti i componenti:
- src/components/layout/articolo.json
- src/components/layout/titolo.json
- src/components/config/tabella.json

### Il plugin non appare nell'admin panel

1. Verifica che il plugin sia abilitato in config/plugins.ts
2. Ricostruisci l'admin panel: npm run build
3. Controlla i log del server per errori

### L'endpoint subtree non funziona

1. Verifica che le routes custom siano in src/api/pagina/routes/0-custom-pagina.ts
2. Il prefisso "0-" assicura che vengano caricate prima delle routes di default
3. Riavvia il server Strapi

---

## Componenti Inclusi

Il content-type Pagina usa questi componenti dynamic zone:

**Layout Components**:
- layout.articolo
- layout.titolo

**Config Components**:
- config.tabella

**Custom Fields**:
- multi-select (campo composizioneTitolo)

---

## Note

- **Strapi Version**: Testato con Strapi 5.16.x e superiori
- **Node Version**: >= 18.0.0
- **Database**: Compatibile con tutti i database supportati da Strapi

---

**Data Export**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

Set-Content -Path "$DestinationPath\README.md" -Value $readmeContent
Write-Success "  [OK] README.md creato con istruzioni"

Write-Host ""

# ============================================================================
# 10. SCRIPT DI INSTALLAZIONE
# ============================================================================
Write-Step "[10/10] Creazione script di installazione automatica..."

$installScriptContent = @'
# ============================================================================
# Script di Installazione Tree-View Plugin
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$StrapiProjectPath
)

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  Tree-View Plugin - Installazione" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# Verifica che sia un progetto Strapi valido
if (-not (Test-Path "$StrapiProjectPath\package.json")) {
    Write-Host "[ERRORE] La cartella specificata non sembra essere un progetto Strapi valido" -ForegroundColor Red
    exit 1
}

Write-Host "Progetto Strapi: $StrapiProjectPath" -ForegroundColor Cyan
Write-Host ""

# 1. Copia plugin tree-view
Write-Host "Copia plugin tree-view..." -ForegroundColor Cyan
$treeViewDest = Join-Path $StrapiProjectPath "src\plugins\tree-view"
Copy-Item -Path ".\src\plugins\tree-view" -Destination $treeViewDest -Recurse -Force
Write-Host "  [OK] Plugin tree-view copiato" -ForegroundColor Green

# 2. Copia plugin pagina-lifecycle (se esiste)
if (Test-Path ".\src\plugins\pagina-lifecycle") {
    Write-Host "Copia plugin pagina-lifecycle..." -ForegroundColor Cyan
    $lifecycleDest = Join-Path $StrapiProjectPath "src\plugins\pagina-lifecycle"
    Copy-Item -Path ".\src\plugins\pagina-lifecycle" -Destination $lifecycleDest -Recurse -Force
    Write-Host "  [OK] Plugin pagina-lifecycle copiato" -ForegroundColor Green
}

# 3. Copia API pagina
Write-Host "Copia API pagina..." -ForegroundColor Cyan
$paginaDest = Join-Path $StrapiProjectPath "src\api\pagina"
Copy-Item -Path ".\src\api\pagina" -Destination $paginaDest -Recurse -Force
Write-Host "  [OK] API pagina copiata" -ForegroundColor Green

# 4. Copia componenti dynamic zone
Write-Host "Copia componenti dynamic zone..." -ForegroundColor Cyan
$componentsDest = Join-Path $StrapiProjectPath "src\components"
Copy-Item -Path ".\src\components" -Destination $componentsDest -Recurse -Force
Write-Host "  [OK] Componenti copiati (layout, config)" -ForegroundColor Green

# 5. Aggiorna plugins.ts
Write-Host "Aggiornamento configurazione plugins..." -ForegroundColor Cyan
$pluginsPath = Join-Path $StrapiProjectPath "config\plugins.ts"

if (-not (Test-Path $pluginsPath)) {
    $pluginsContent = @"
export default {
  'tree-view': {
    enabled: true,
    resolve: './src/plugins/tree-view'
  },
  'pagina-lifecycle': {
    enabled: true,
    resolve: './src/plugins/pagina-lifecycle'
  },
  'multi-select': {
    enabled: true,
  },
};
"@
    Set-Content -Path $pluginsPath -Value $pluginsContent
    Write-Host "  [OK] File plugins.ts creato" -ForegroundColor Green
} else {
    Write-Host "  [WARN] File plugins.ts gia esistente - aggiorna manualmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  IMPORTANTE: Installa le dipendenze!" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Esegui questi comandi nel progetto di destinazione:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  cd $StrapiProjectPath" -ForegroundColor White
Write-Host "  npm install strapi-plugin-multi-select@^2.1.1" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  npm run develop" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Installazione completata!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prossimi passi:" -ForegroundColor Cyan
Write-Host "1. Rebuild admin panel: npm run build" -ForegroundColor White
Write-Host "2. Avvia Strapi: npm run develop" -ForegroundColor White
Write-Host ""
'@

Set-Content -Path "$DestinationPath\install.ps1" -Value $installScriptContent
Write-Success "  [OK] Script install.ps1 creato"

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Export completato con successo!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Riepilogo:" -ForegroundColor Cyan
Write-Host ""

$totalFiles = (Get-ChildItem -Path $DestinationPath -Recurse -File).Count
$totalSize = [math]::Round((Get-ChildItem -Path $DestinationPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host "  Cartella: $DestinationPath"
Write-Host "  File totali: $totalFiles"
Write-Host "  Dimensione: $totalSize MB"
Write-Host ""

Write-Host "Contenuto esportato:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Plugin tree-view completo"
Write-Host "  [OK] Plugin pagina-lifecycle"
Write-Host "  [OK] Endpoint custom subtree (/pagina/subtree/:slug)"
Write-Host "  [OK] Content-type pagina"
Write-Host "  [OK] Componenti dynamic zone (layout, config)"
Write-Host "  [OK] Controllers e services"
Write-Host "  [OK] package.json"
Write-Host "  [OK] README.md con istruzioni"
Write-Host "  [OK] Script di installazione (install.ps1)"
Write-Host ""

Write-Host "Per installare in un altro progetto Strapi:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  cd $DestinationPath"
Write-Host "  .\install.ps1 -StrapiProjectPath C:\path\to\strapi\project"
Write-Host ""
Write-Host "IMPORTANTE: Dopo l'installazione, installa le dipendenze:" -ForegroundColor Yellow
Write-Host "  npm install strapi-plugin-multi-select@^2.1.1"
Write-Host ""

Write-Host "Oppure segui le istruzioni nel README.md" -ForegroundColor Cyan
Write-Host ""
