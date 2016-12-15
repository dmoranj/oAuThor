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
The system currently implements various OAuth 2.0 flows. The actual flow to use depends on how the process is initiated
and by whom (the Client or the Resource Owner). 

### OAuth Roles

Through all this documentation, some OAuth-specific terms will be used:

* Resource Server (RS): is the server that hosts the data or services that wants to be authorized. 
* Resource Owner (RO): is a user of the Resource Server, whose resources will be acessed.
* Client: is the application the Resource Owner is using. The client will access the resources of the RO on its behalf.
* Authorization Server (AS): central authority that manages the OAuth 2.0 Authorization flow. 

OAuThor implements the AS and a proxy that performs all the OAuth-related tasks of the RS. Some Clients and
Resource Owner user agents will be implemented, though, as an integration example.

### Implementation-specific details

The OAuth 2.0 specification leaves some freedom to the developer in certain implementation details. Here are some of them
explained:
* Unlike other OAuth 2.0 providers, oAuThor does not provides resources of its own, but a proxy that can be used to
protect whatever rest resource is put behind it. In order for OAuthor to be able to check the resource owner and scope 
of a given URL, and thus to decide whether to allow the request or deny it, the protected resources should use
urls following this path convention (the protected RS should give OAuthor regular expressions to extract each of this):
  * All the resources belonging to a user should be under a scope from which the id of the user can be extracted using a RE.
  * The protected scope will be matched against the path of the resource.
* The specification doesn't specify who or how the access token validity is checked. It doesn't specify how the RS
should integrate with the overall authorization flux. In our implementation we provide a proxy (instantiated
within the AS process) that is connected to the RS. This proxy is the responsible of the validity and scope checking 
of the token.
* The authentication authorities are also leaved as implementation details: the Authorization Server is usually the 
authentication endpoint, but its not specified whether it should use its own mechanisms or whether it should delegate 
it in other authorities. OAuThor approach is to authenticate Client requests with the credentials generated along with the
client creation and delegate RO authentication to the RS. Preconfigured admin credentials will also be provided.
* To allow multiple different grants over the same RS, some prerequisites were imposed on the Client Credentials grant
(that gives permission to the client without interaction with the RO). To avoid unwanted Client Credential acceses to
resources of different Resource Owners, the Client using this grant can only access its own resources, that is, it
is considered that the Client and the Resource Owner are both the same (so if the Client wants to access resources
of a different RO, that is, a real user using the Client, it will have to choose another grant type).
* I don't really understand the need of the D-E steps on the Implicit Grant description, so I will suppose the browser
is capable of retrieving the token from the fragment in the diagrams (it doesn't affect the server side, that is, 
the OAuThor implementation, anyway).

### Authorization Flows

#### Authorization Code Grant

This three legged Grant is intended to be used in server to server authorization, where the client credentials are
confidential (they aren't distributed or downloaded into a frontend app). The flow is based in browser redirections
between the AS and the Client, that will in turn produce a short-lived token and an optional long-lived refresh token. 
Refresh tokens can be used to obtain new access tokens without RO interaction.

![Alt text](https://raw.github.com/dmoranj/oAuThor/master/img/oAuth2%20Flow.png "Authentication Code Overview")

#### Resource Owner Credentials Grant

In this grant, the Client is considered to be trusted by the RO. The RO gives the Client its credentials and the 
client use them to get an access token directly from the AS. This flow is mainly targeted to mobile devices.

![Alt text](https://raw.github.com/dmoranj/oAuThor/master/img/oAuth2%20ROC.png "Resource Owner Credentials Overview")

#### Implicit Grant

This grant allows the RO to directly access its resources without interacting with the Client; is the RO's user agent
(thr browser, for example) who uses his credentials to retrieve a token from the AS, using it, in turn, to access
the RS. Once the data has been extracted from the RS, it can be sent to the Client.

![Alt text](https://raw.github.com/dmoranj/oAuThor/master/img/oAuth2%20Implicit.png "Implicit Grant Credentials Overview")

#### Client Credentials Grant

This grant is the simplest one, and basically depicts a basic authentication between the Client and the AS with a 
set of short-lived and long-lived tokens, to avoid sending the credentials over and over again to the server.

![Alt text](https://raw.github.com/dmoranj/oAuThor/master/img/oAuth2%20CC.png "Client Credentials Overview")

Implementation details
----------------------
The system is implemented as a single Node.JS application, using [Express](http://expressjs.com/) for REST 
interaction and [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) for the authorization proxy. BDD tests
are executed with [mocha](http://mochajs.org/) and [should](https://github.com/visionmedia/should.js), 
and cover the functionality end to end. Test coverage is provided by [istanbul](https://github.com/gotwarlost/istanbul).
