# Tree View Plugin (Custom)

Plugin locale per Strapi v5 che mostra una gerarchia (albero) di un content-type con relazione self-reference (campo parent che punta alla stessa CT).

## Endpoint

GET /admin/plugins/tree-view/tree?contentType=api::pagina.pagina&parentField=parent&labelField=title

## UI

Nel backoffice appare una nuova voce di menu "Tree View". Compila i campi e clicca "Aggiorna" per vedere l'albero.

Se non appare la voce nel menu:
1. Assicurati che il plugin sia nella lista Settings > Plugins.
2. Esegui `npm run build` dopo aver aggiunto il plugin.
3. Svuota cache browser (hard reload / finestra anonima).
4. Controlla la console per `[tree-view] admin register()`.

## Note

- Assicura che il content-type scelto abbia un campo relazione al medesimo CT (es: parent manyToOne).
- Se non specifichi labelField il plugin tenta title, poi name, poi label, infine id.
- L'endpoint restituisce un array di nodi root, ognuno con children ricorsivi.

## Estensioni future

- Drag & drop per riordinare / riparent
- Permessi granulari
- Cache e pagination per collezioni molto grandi
 - Pulsante per aprire direttamente l'entry
