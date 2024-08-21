const vscode = require("vscode");
const cheerio = require("cheerio");
const {
  provideAccessibilitySuggestions,
} = require("./ai-accessibility-api.js");
const processedDocuments = new Set();
let animationInterval;
let currentRequest = null;

function activate(context) {
  console.log("inside extension activate method");
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("accessibility");

  async function checkAccessibility(document) {
    console.log("inside extension check accessibility method");
    if (
      document.languageId !== "html" ||
      processedDocuments.has(document.uri.toString())
    ) {
      return;
    }

    if (currentRequest) {
      currentRequest.abort();
      stopLoadingAnimation();
    }
    currentRequest = new AbortController();

    const text = document.getText();

    try {
      startLoadingAnimation();

      const suggestions = await provideAccessibilitySuggestions(text, currentRequest.signal);

      // Process the document with Cheerio
      const $ = cheerio.load(
        text,
        {
          normalizeWhitespace: false,
          xmlMode: true,
          selfClosingTags: false,
          decodeEntities: false,
          selfClosingTags: true,
          lowerCaseAttributeNames: false,
        },
        false
      );
      // const cheerioHtml = $.html();

      // // Update the document with the processed HTML, to avoide cheerio mismatch
      // const edit = new vscode.WorkspaceEdit();
      // edit.replace(
      //   document.uri,
      //   new vscode.Range(
      //     document.positionAt(0),
      //     document.positionAt(text.length)
      //   ),
      //   cheerioHtml
      // );
      // await vscode.workspace.applyEdit(edit);

      // when user close the file before ai response
      if(!suggestions){
        return null;
      }

      const diagnostics = suggestions
        .flatMap((suggestion) => {
          const element = $(suggestion.selector);

          // Create a diagnostic for each edit in the suggestion
          return suggestion.edits.map((edit) => {
            if (element.length > 0) {
              elementText = element.toString();

              const oldText = edit.oldText;
              let startOffset = document.getText().indexOf(oldText);
              let endOffset = startOffset + oldText.length;

              // If oldText is not found, fallback to using elementText
              if (startOffset < 0) {
                startOffset = document.getText().indexOf(elementText);
                endOffset = startOffset + elementText.length;
              }

              if (startOffset !== -1) {
                const startPosition = document.positionAt(startOffset);
                const endPosition = document.positionAt(endOffset);
                const range = new vscode.Range(startPosition, endPosition);
                const diagnostic = new vscode.Diagnostic(
                  range,
                  suggestion.message,
                  vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = "Suggestions by A11yAssist";
                diagnostic.code = {
                  value: suggestion.fix,
                  target: vscode.Uri.parse(
                    `command:accessibility.applyFix?${encodeURIComponent(
                      JSON.stringify({
                        ...suggestion,
                        fix: edit.newText,
                      })
                    )}`
                  ),
                };
                
                return diagnostic;
              }
              return null;
            }
          });

          return [];
        })
        .filter((diagnostic) => diagnostic !== null);

      diagnosticCollection.set(document.uri, diagnostics);
      processedDocuments.add(document.uri.toString());
    } catch (error) {
      vscode.window.showErrorMessage(
        "Error occurred while checking accessibility. error - " + error
      );
    } finally {
      stopLoadingAnimation();
      currentRequest = null;
    }
  }

  function startLoadingAnimation() {
    if(animationInterval){
      clearInterval(animationInterval);
    }

    let dots = "";
    let count = 0;

    animationInterval = setInterval(() => {
      dots = ".".repeat(count % 4);
      vscode.window.setStatusBarMessage(`A11yAssist is worknig${dots}`);
      count++;
    }, 500);
  }

  function stopLoadingAnimation() {
    clearInterval(animationInterval);
    vscode.window.setStatusBarMessage("");
  }

  function applyFix(suggestion) {
    try {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const $ = cheerio.load(
          document.getText(),
          {
            normalizeWhitespace: false,
            xmlMode: true,
            selfClosingTags: false,
            decodeEntities: false,
            selfClosingTags: true,
            lowerCaseAttributeNames: false,
          },
          false
        );

        suggestion.edits.forEach((edit) => {
          const element = $(edit.selector);

          if (element.length > 0) {
            let startOffset = document.getText().indexOf(edit.oldText);
            let endOffset = startOffset + edit.oldText.length;
            let elementText = element.toString();
            if (startOffset < 0) {
              startOffset = document.getText().indexOf(elementText);
              endOffset = startOffset + elementText.length;
            }

            if (startOffset !== -1) {
              const startPosition = document.positionAt(startOffset);
              const endPosition = document.positionAt(endOffset);
              const range = new vscode.Range(startPosition, endPosition);
              const workspaceEdit = new vscode.WorkspaceEdit();
              workspaceEdit.replace(document.uri, range, edit.newText);
              vscode.workspace.applyEdit(workspaceEdit);
            }
          }
        });

        // Remove the specific diagnostic that corresponds to the applied fix
        const diagnostics = diagnosticCollection.get(document.uri);
        const updatedDiagnostics = diagnostics.filter((diagnostic) => {
          const suggestionFromDiagnostic = JSON.parse(
            decodeURIComponent(diagnostic.code.target.query)
          );
          return suggestionFromDiagnostic.selector !== suggestion.selector;
        });
        diagnosticCollection.set(document.uri, updatedDiagnostics);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        "Error occurred while applying fix. error - " + error
      );
    }
  }

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("html", {
      provideCodeActions(document, range) {
        const diagnostic = diagnosticCollection
          .get(document.uri)
          .find((d) => d.range.contains(range));
        if (!diagnostic) {
          return;
        }

        const suggestion = JSON.parse(
          decodeURIComponent(diagnostic.code.target.query)
        );
        const action = new vscode.CodeAction(
          suggestion.fix,
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          command: "accessibility.applyFix",
          title: "Apply Fix",
          arguments: [suggestion],
        };
        return [action];
      },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("accessibility.applyFix", applyFix)
  );

  vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === "html") {
      if (currentRequest) {
        currentRequest.abort();
        stopLoadingAnimation();
      }
      setTimeout(() => {
        checkAccessibility(document);
      }, 100);  
    }
  })

  vscode.workspace.onDidCloseTextDocument((document) => {
   try {
    if (currentRequest) {
      currentRequest.abort();
      stopLoadingAnimation();
    }
    processedDocuments.delete(document.uri.toString());
    diagnosticCollection.delete(document.uri);
  } catch(error){
    console.log('error in closing document ' + error);
  }
  });

  // vscode.workspace.onDidChangeTextDocument((event) => {
  //   checkAccessibility(event.document);
  // });
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
