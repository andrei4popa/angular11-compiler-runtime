import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild, ViewContainerRef, ComponentRef,
  Compiler, ComponentFactory, NgModule, ModuleWithComponentFactories, ComponentFactoryResolver, AfterViewInit, HostListener
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'PersonList';
  visibleUrl = false;
  targetUrl = 'localhost:8000';

  channal: any;

  private componentRef: ComponentRef<any> | any;
  @ViewChild('cardConteiner', { read: ViewContainerRef }) container: any;

  pform = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [''],
    phone: ['']
  });



  constructor(
    private formBuilder: FormBuilder,
    private compiler: Compiler,
    public sanitizer: DomSanitizer) {
  
  }
  ngAfterViewInit(): void {
    this.initMessanger();
  }

  initMessanger() {
    var iframe = document.getElementById('iframe') as any;
    this.channal = iframe.contentWindow;
    if (this.channal.addEventListener) {
      this.channal.addEventListener("message", this.receiveMessage, false);
    } else {
      this.channal.attachEvent("onmessage", this.receiveMessage);
    }
  }

  receiveMessage(event: any) {
    if (event.origin !== this.targetUrl)
      return;

    let found = null;

    this.personList.forEach(x => {
      if (x.id === event.data.id) {
        found = true;
        Object.assign(x, event.data);
      }
    });

    if (!found) {
      this.personList.push(event.data);
    }
  }

  save() {
    this.render();
    this.channal.postMessage(this.selected);
  }

  public selected: any = {};
  public personList: Array<any> = [
    {
      id: 1,
      firstName: 'Andrei',
      lastName: 'Popa',
      gender: 'm',
      email: 'andrei.popa@gmail.com',
      phone: '+123123455',
      template: `<h1>{{person.firstName}} {{person.lastName}}</h1>
    <strong *ngIf="!!person.email"> Email: {{person.email}} </strong>`  },
    {
      id: 2,
      firstName: 'Elon',
      lastName: 'Musk',
      gender: 'm',
      email: 'musk@spacex.com',
      phone: '+123123455',
      template: `<h1>{{person.firstName}} {{person.lastName}}</h1>
    <strong *ngIf="!!person.email"> Email: {{person.email}} </strong>`  }
  ]

  selectedPerson(person: any) {
    this.selected = person;
    this.render();
  }

  addPerson(data: any) {
    this.personList.push(data);
    this.channal.postMessage(data);
  }

  render() {
    this.container.clear();

    let factory = this.createComponentFactorySync(this.compiler, {
      selector: `runtime`,
      template: this.selected.template
    }, null);

    if (this.componentRef) {
      this.componentRef.destroy();
    }

    this.componentRef = this.container.createComponent(factory);
    this.componentRef.instance.person = this.selected;
  }


  private createComponentFactorySync(compiler: Compiler, temp: Component, componentClass: any): ComponentFactory<any> | undefined {
    const cmpClass =
      componentClass ||
      class RuntimeComponent {
        person: any;
      };
    const decoratedCmp = Component(temp)(cmpClass);

    @NgModule({ imports: [CommonModule], declarations: [decoratedCmp] })
    class RuntimeComponentModule { }

    let module: ModuleWithComponentFactories<any> = compiler.compileModuleAndAllComponentsSync(RuntimeComponentModule);
    return module.componentFactories.find(f => f.componentType === decoratedCmp);
  }
}
