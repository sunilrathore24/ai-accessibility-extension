const vscode = require("vscode");
const { provideAccessibilitySuggestions } = require("./ai-accessibility-api.js");
const processedDocuments = new Set();

function activate(context) {
  console.log('inside extension activate method');
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("accessibility");

  async function checkAccessibility(document) {
    console.log('inside extension check accessibility method');
    if (document.languageId !== "html" || processedDocuments.has(document.uri.toString())) {
      return;
    }

    const text = document.getText();

    try {
      const suggestions =await provideAccessibilitySuggestions(text);

      const diagnostics = suggestions.map((suggestion) => {
        const range = new vscode.Range(
          document.positionAt(suggestion.startPoint),
          document.positionAt(suggestion.endPoint)
        );
        const diagnostic = new vscode.Diagnostic(
          range,
          suggestion.message,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.source = "Accessibility by CodeAccessibility Guardians";
        diagnostic.code = {
          value: suggestion.fix,
          target: vscode.Uri.parse(`command:accessibility.applyFix?${encodeURIComponent(JSON.stringify(suggestion))}`)
        };
        return diagnostic;
      });

      diagnosticCollection.set(document.uri, diagnostics);
      processedDocuments.add(document.uri.toString());
    } catch (error) {
      vscode.window.showErrorMessage(
        "Error occurred while checking accessibility. error - " + error 
      );
    }
  }

  async function applyFix(suggestion) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
  
    const workspaceEdit = new vscode.WorkspaceEdit();
  
    suggestion.edits.forEach((edit) => {
      const range = new vscode.Range(
        editor.document.positionAt(edit.range.start),
        editor.document.positionAt(edit.range.end)
      );
      workspaceEdit.replace(editor.document.uri, range, edit.newText);
    });
  
    await vscode.workspace.applyEdit(workspaceEdit);
    const diagnostics = diagnosticCollection.get(editor.document.uri);
    const updatedDiagnostics = diagnostics.filter(
      (d) => !d.range.contains(editor.selection.start)
    );
    diagnosticCollection.set(editor.document.uri, updatedDiagnostics);
  }
  

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("html", {
      provideCodeActions(document, range) {
        const diagnostic = diagnosticCollection.get(document.uri).find((d) =>
          d.range.contains(range)
        );
        if (!diagnostic) {
          return;
        }

        const suggestion = JSON.parse(decodeURIComponent(diagnostic.code.target.query));
        const action = new vscode.CodeAction(
          suggestion.fix,
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          command: "accessibility.applyFix",
          title: "Apply Fix",
          arguments: [suggestion]
        };
        return [action];
      }
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
