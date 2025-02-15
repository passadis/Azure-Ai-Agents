<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=azure,react,nodejs,js,docker,vite,vscode" />
  </a>
</p>


# Azure AI Agent Service

## Introduction
The Azure AI Agent Service is a fully managed platform that enables developers to build, deploy, and scale AI agents seamlessly. These agents can perform tasks ranging from answering questions to automating complex workflows by integrating advanced language models with various tools and data sources.

## Features
- **Automatic Tool Integration**: Agents can autonomously utilize tools like code interpreters and data retrieval systems without manual intervention.
- **Secure Data Management**: Leverages Azure's security infrastructure to ensure data privacy and compliance.
- **Flexible Model Selection**: Supports various AI models, including Azure OpenAI and third-party models, allowing developers to choose the most suitable model for their needs.
- **Extensive Data Integrations**: Agents can access and interact with multiple data sources, such as Bing Search and Azure AI Search, to provide relevant and up-to-date information.

## Getting Started

### Prerequisites
- **Azure Subscription**: An active Azure account.
- **Azure AI Foundry Hub**: Set up an AI Foundry hub in your Azure subscription.
- **Development Environment**: Node.js 18+ installed on your local machine.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/azure-ai-agent-service.git
   cd azure-ai-agent-service
   ```

2. **Install Dependencies both for Frontend and Backend**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add the required variables:
     ```env
       KEYVAULT_NAME
       ....
     ```
   ```

## Resources
- [Azure AI Agent Service Documentation](https://learn.microsoft.com/en-us/azure/ai-services/agents/overview)
- [Azure AI Foundry SDK](https://github.com/microsoft/Agents)
- [Sample Projects](https://github.com/Azure-Samples/azure-ai-agent-service-enterprise-demo)

## Contributing
We welcome contributions to enhance the Azure AI Agent Service. Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

This README provides a comprehensive overview of the Azure AI Agent Service, guiding users from setup to interaction. For more detailed information, refer to the official documentation and sample projects linked above.

