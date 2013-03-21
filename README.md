oAuThor
=======
*"The security framework of the God Of Thunder"*

oAuThor is a security framework created for experimenting with the OAuth 2.0 flows. The goal is to design an 
Authorization Server capable of managing Server-side Web Application Flows (Authorization code grant in the RFC). The
system will provide:

* Access control based on bearer tokens with a resource proxy.
* Authorization server, capable of: managing client apps, grants and authorization codes and creation and management of bearer tokens.

Current implementation does not persist its information about clients, tokens and grants, for its purpose its merely
experimental.

Authorization Process
---------------------
The system implements OAuth 2.0 Web Application Flow, as depicted by the figure:

![Alt text](https://raw.github.com/dmoranj/oAuThor/master/img/oAuth2%20Flow.png "Authorization Overview")

Unlike other OAuth 2.0 providers, oAuThor does not provides resources of its own, but a proxy that can be used to
protect whatever rest resource is put behind it.

Code description
----------------
The system is implemented as a single Node.JS application, using [Express](http://expressjs.com/) for REST 
interaction and [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) for the authorization proxy. BDD tests
are executed with [jasmine-node](https://github.com/mhevery/jasmine-node), and cover the functionality end to end.
