import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:secure_biometric_app/screens.dart';
import 'package:secure_biometric_app/main.dart';

void main() {
  test('valida e-mail e senha', () {
    expect(emailValidator('marcos@example.com'), null);
    expect(emailValidator('marcos'), isNotNull);
    expect(passwordValidator('123'), isNotNull);
    expect(passwordValidator('SenhaSegura123!'), null);
  });
  testWidgets('sem configuração mostra uma orientação segura', (tester) async {
    await tester.pumpWidget(const SetupApp());
    expect(find.textContaining('conectado ao servidor'), findsOneWidget);
    expect(find.byType(TextField), findsNothing);
  });
}
