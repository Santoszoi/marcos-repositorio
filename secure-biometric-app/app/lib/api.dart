import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int status;
  final String message;
  const ApiException(this.status, this.message);
  @override
  String toString() => message;
}

class Api {
  final Uri base;
  final http.Client client;
  String? token;
  Api(String url, {http.Client? client})
    : base = Uri.parse(url.endsWith('/') ? url : '$url/'),
      client = client ?? http.Client() {
    if (base.host.isEmpty || !['http', 'https'].contains(base.scheme)) {
      throw const ApiException(0, 'Endereço da API inválido.');
    }
    const allowHttp = bool.fromEnvironment('ALLOW_HTTP', defaultValue: false);
    if (base.scheme != 'https' && !allowHttp) {
      throw const ApiException(
        0,
        'Configure uma API HTTPS. Para testes locais, use ALLOW_HTTP=true.',
      );
    }
  }
  Future<Map<String, dynamic>> call(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    final request = http.Request(method, base.resolve(path));
    request.headers['Content-Type'] = 'application/json';
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    if (body != null) request.body = jsonEncode(body);
    try {
      final response = await http.Response.fromStream(
        await client.send(request).timeout(const Duration(seconds: 20)),
      ).timeout(const Duration(seconds: 20));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          response.statusCode,
          data['message'] as String? ?? 'Não foi possível concluir.',
        );
      }
      return data;
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(
        0,
        'Não foi possível conectar. Confira a internet e tente novamente.',
      );
    }
  }

  void dispose() => client.close();
}
