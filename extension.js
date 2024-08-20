const vscode = require("vscode");
const cheerio = require("cheerio");
const {
  provideAccessibilitySuggestions,
} = require("./ai-accessibility-api.js");
const processedDocuments = new Set();
let animationInterval;

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

    const text = document.getText();

    try {
      startLoadingAnimation();

      const suggestions = await provideAccessibilitySuggestions(text);

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
      const cheerioHtml = $.html();

      // Update the document with the processed HTML, to avoide cheerio mismatch
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        ),
        cheerioHtml
      );
      await vscode.workspace.applyEdit(edit);

      const diagnostics = suggestions
        .map((suggestion) => {
          const element = $(suggestion.selector);
          if (element.length > 0) {
            let elementText;
            if (element.children.length > 1) {
              elementText = element.parent.toString();
            } else {
              elementText = element.toString();
            }

            const startOffset = document.getText().indexOf(elementText);
            const endOffset = startOffset + elementText.length;
            const startPosition = document.positionAt(startOffset);
            const endPosition = document.positionAt(endOffset);
            const range = new vscode.Range(startPosition, endPosition);
            const diagnostic = new vscode.Diagnostic(
              range,
              suggestion.message,
              vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = "Suggessions by A11yAssist ";
            diagnostic.code = {
              value: suggestion.fix,
              target: vscode.Uri.parse(
                `command:accessibility.applyFix?${encodeURIComponent(
                  JSON.stringify(suggestion)
                )}`
              ),
            };
            return diagnostic;
          }
          return null;
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
    }
  }

  function startLoadingAnimation() {
    let dots = "";
    let count = 0;

    animationInterval = setInterval(() => {
      dots = ".".repeat(count % 4);
      vscode.window.setStatusBarMessage(`AI extension is working${dots}`);
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
    checkAccessibility(document);
  });

  vscode.workspace.onDidCloseTextDocument((document) => {
    processedDocuments.delete(document.uri.toString());
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
