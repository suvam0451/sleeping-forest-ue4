# Change Log

## [0.6.8] - 17 Feb 2020

- Oh my god !!! Did I just forget to break a switch statement ? _smh_.
- Remember to run context again on generated function body to add code to source file guys <3.
- Sidenote : Always make sure you exit switch statements !!!

## [0.6.7] - 17 Feb 2020

---

- Removed complicated settings. Edits made to the **.code-workspace** file is now fully customizable by you using `SF.excludeFolders`, `SF.searchExclude`, `SF.excludedExtensions`.
- This means, unless you are working on Editor extensions, you get best results using the default settings itself.
- Patched a bug where Context won't activate with components with default values in header

### Feature Updates:

- Added `UE4 : Add Override function`. Helps adding { OnConstruction, Tick, BeginPlay etc.}
- Also **supports context key**. Activates from lines with { public: , private: , protected: } in header.
- Can be extended with `Functions_Ext.json` in sidebar. See `Functions_Core.json`(ReadOnly) for default list.
- Added `SF.excludeFolders`, `SF.searchExclude`, `SF.excludedExtensions` for more control.
- Removed `SF.allowUserExtensions`. Modding support is always on from now.

## [0.6.6] - 16 Feb 2020

---

- Modders can now add extensions right from the editor sidebar.
- Folders for AssetStreams are automatically added to sidebar under UE4.
- Examples for modding added. Just see the entries in the JSON files in the sidebar for reference.
- Updated tutorials for asset streams will be available by next week.
- Return by reference is supported for functions.

## [0.6.5]

- Allowed adding header packs in source file (fwd declaration)
- Documentation for asset streams available [here](https://suvam0451.netlify.com/docs/sleeping-forest/hello-asset-streams)
- Settings are now permanenetly moved to **Sleeping Forest** category
- The settings now use the syntax **"sf-ue4:settings"** and can be searched by `SF:settings`
- Modified uenum and ustruct snippet for better access.
- Removed redundant command `UE4 : Hello World`
- Update the context keybindings : `extension.Daedalus.tryInitialize` --> `extension.sf.tryInitialize` (**UE4 : Action by context**)
- Components with nullptr default value are now detected.

## [0.6.4]

- Stable release for beta participation

## [0.6.3]

- **Beta release**
- Fixed forward declaration issues in function body generation.
- Integrated texture packer micro-service.
- Added documentations for snippets types and lists [here](https://suvam0451.netlify.com/docs/trailblazer/snippets-overview)
